declare global {
  /** HTTP 请求信息 */
  const $request: {
    /** 请求URL */
    url: string
    /** 请求方法 */
    method: string
    /** 请求头 */
    headers: Record<string, string>
    /**
     * 请求的body
     *
     * 当 `requires-body = true` 时才有值
     */
    body?: string | Uint8Array
  }

  /** 替换请求信息 */
  function $done(params: HTTPClientParams)
  /** 直接向该请求返回一个假的响应 */
  function $done(params: HTTPClientResponse & { body?: unknown })
  /** 空 JS 对象，请求继续，任何请求参数不会有任何变化 */
  function $done(params: {}): void
  /** 不传任何参数，表示放弃该请求，请求连接会直接断开 */
  function $done(): void

  interface HTTPClientParams {
    url: string
    /** 请求超时，单位ms，默认5000ms */
    timeout?: number
    headers?: Record<string, string>
    /** 仅仅在post请求中有效，格式可以是一个json对象、字符串、二进制等 */
    body?: string
    /** 当有该字段时，会将body当做base64的格式解析成二进制，如果body参数不是base64后的二进制，请不要设定该值（build 612版本后有效） */
    'body-base64'?: boolean
    /** 指定该请求使用哪一个节点或者策略组（可以使节点名称、策略组名称，也可以说是一个Loon格式的节点描述，如：node:"shadowsocksr,example.com,1070,chacha20-ietf,"password",protocol=auth_aes128_sha1,protocol-param=test,obfs=plain,obfs-param=edge.microsoft.com"） */
    node?: string
    /** 请求响应返回二进制格式，默认false */
    'binary-mode'?: boolean
    /** 是否自动处理重定向，默认true（build 660+） */
    'auto-redirect'?: boolean
    /** 是否自动存储并使用cookie，默认true（build 662+） */
    'auto-cookie'?: boolean
    /** 采用的http请求方式，目前支持h1和h2，默认h1（build 715+），脚本中有多个相同host请求时推荐h2，增强请求并发性能 */
    alpn?: 'h1' | 'h2'
  }

  interface HTTPClientResponse {
    status: number
    headers: Record<string, string>
  }

  type HTTPClientCallback<T = unknown> = (
    errMsg: string | null,
    response: HTTPClientResponse,
    data: T
  ) => void;

  const $httpClient: {
    /**
     * 发起 HTTP GET 请求
     */
    get<T = unknown>(
      params: HTTPClientParams,
      callback: HTTPClientCallback<T>
    ): void;
    /**
     * 发起 HTTP POST 请求
     */
    post<T = unknown>(
      params: HTTPClientParams,
      callback: HTTPClientCallback<T>
    ): void;
    /**
     * 发起 HTTP HEAD 请求
     */
    head<T = unknown>(
      params: HTTPClientParams,
      callback: HTTPClientCallback<T>
    ): void;
    /**
     * 发起 HTTP DELETE 请求
     */
    delete<T = unknown>(
      params: HTTPClientParams,
      callback: HTTPClientCallback<T>
    ): void;
    /**
     * 发起 HTTP PUT 请求
     */
    put<T = unknown>(
      params: HTTPClientParams,
      callback: HTTPClientCallback<T>
    ): void;
    /**
     * 发起 HTTP OPTIONS 请求
     */
    options<T = unknown>(
      params: HTTPClientParams,
      callback: HTTPClientCallback<T>
    ): void;
    /**
     * 发起 HTTP PATCH 请求
     */
    patch<T = unknown>(
      params: HTTPClientParams,
      callback: HTTPClientCallback<T>
    ): void;
  };

  const $argument: Record<string, string | boolean>
}

export {};
