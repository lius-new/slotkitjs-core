/**
 * 认证服务契约
 * 定义认证服务必须实现的接口
 */
export interface IAuthService {
  /**
   * 用户登录
   * @param username 用户名
   * @param password 密码
   * @returns 登录是否成功
   */
  login(username: string, password: string): Promise<boolean>
  
  /**
   * 用户登出
   */
  logout(): Promise<void>
  
  /**
   * 检查用户是否已认证
   */
  isAuthenticated(): boolean
  
  /**
   * 获取当前用户信息
   */
  getUser(): { username: string } | null
}
