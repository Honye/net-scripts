import { zipSync } from 'fflate';

const GITHUB_TOKEN = $argument.token;

main();

async function main() {
  const url = $request.url;
  const pattern = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)\.zip$/;
  const match = url.match(pattern);

  if (!match) {
    // 如果 URL 不匹配，不做任何事，直接返回原始响应
    return $done({});
  }

  try {
    const [, owner, repo, branch, folderPath] = match;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`;

    console.log(`开始处理: ${owner}/${repo}/${branch}/${folderPath}`);

    // 1. 递归获取所有文件元数据
    const allFilesMeta = await getFileMetadata(apiUrl);

    if (allFilesMeta.length === 0) {
      return handleError('此文件夹为空或不存在。');
    }

    console.log(`找到 ${allFilesMeta.length} 个文件，开始下载...`);

    // 2. 并行下载所有文件内容
    const downloadedFiles = await Promise.all(allFilesMeta.map((file) => downloadFile(file)));

    // 3. 准备 fflate 需要的数据结构
    const filesToZip = {};
    downloadedFiles.forEach((file) => {
      if (file) {
        // 计算 ZIP 内的相对路径
        const relativePath = file.path.startsWith(folderPath + '/')
          ? file.path.substring(folderPath.length + 1)
          : file.path;
        filesToZip[relativePath] = file.content;
      }
    });

    console.log('所有文件下载完成，开始压缩...');

    // 4. 使用 fflate 同步压缩
    const zipData = zipSync(filesToZip);

    console.log('压缩完成，准备响应。');

    // 5. 构建并返回 ZIP 文件响应
    const zipFileName = folderPath.split('/').pop() + '.zip';
    $done({
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${zipFileName}"`
        },
        body: zipData // Loon 支持直接返回 Uint8Array 作为 body
      }
    });
  } catch (error) {
    console.log(`脚本出错: ${error.message}`);
    handleError(`脚本执行失败: ${error.message}`);
  }
}

/**
 * 递归获取文件元数据
 * @param {string} apiUrl
 * @returns {Promise<{ path: string; url: string }[]>}
 */
function getFileMetadata(apiUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await apiRequest(apiUrl);
      /**
       * @type {{ path: string; url: string }[]}
       */
      let fileList = [];

      for (const item of data) {
        if (item.type === 'file') {
          fileList.push({ path: item.path, url: item.download_url });
        } else if (item.type === 'dir') {
          const subFiles = await getFileMetadata(item.url);
          fileList = fileList.concat(subFiles);
        }
      }
      resolve(fileList);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 下载单个文件内容
 * @param {{ path: string; url: string }} fileMeta
 * @returns {Promise<{ path: string; content: Uint8Array } | null>}
 */
function downloadFile(fileMeta) {
  return new Promise((resolve) => {
    $httpClient.get({ url: fileMeta.url, 'binary-mode': true }, (error, response, data) => {
      if (error || response.status !== 200) {
        console.log(`下载失败: ${fileMeta.path}`);
        resolve(null); // 单个文件下载失败不中断全部
      } else {
        // data 是 ArrayBuffer，fflate 需要 Uint8Array
        resolve({ path: fileMeta.path, content: new Uint8Array(data) });
      }
    });
  });
}

/**
 * 封装的 GitHub API 请求
 * @param {string} url
 */
function apiRequest(url) {
  const headers = {};
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  return new Promise((resolve, reject) => {
    $httpClient.get({ url, headers }, (error, response, data) => {
      if (error || response.status !== 200) {
        reject(new Error(`API 请求失败: ${error || response.status}`));
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

/**
 * 统一错误处理
 */
function handleError(message) {
  $done({
    response: {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: message
    }
  });
}
