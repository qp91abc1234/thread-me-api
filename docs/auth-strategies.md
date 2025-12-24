# 认证策略说明

## Local 策略

通过授权守卫（Guard）调用，用于验证用户名和密码。

**工作流程：**
1. 从请求体中提取 username 和 password
2. 在 validate 方法中实现用户名和密码的验证
3. 如果验证成功，将返回的用户信息添加到 req.user
4. 如果验证失败，则抛出 BusinessExceptions.PWD_ERR() 异常

**相关代码位置：** `src/modules/auth/strategy/local.strategy.ts`

## JWT 策略

通过授权守卫（Guard）调用，用于验证请求中的 JWT token。

**工作流程：**
1. 从请求头 Authorization 中提取 Bearer token
2. 验证 token 的签名和有效期
3. 如果 token 有效，解析 payload 并调用 validate 方法
4. validate 方法的返回值会被添加到 req.user

**相关代码位置：** `src/modules/auth/strategy/jwt.strategy.ts`

## GitHub OAuth 策略

通过授权守卫（Guard）调用，该策略在 github 登录流程中会被调用两次：

**第一次调用：**
- 在 `/auth/github-login` 路由中，根据授权选项构建 GitHub 授权 URL 并重定向

**第二次调用：**
- 在 `/auth/github-callback` 路由中，使用回调 URL 中的 code 换取用户信息
- 获取用户信息后调用 validate 方法，返回值会被添加到 req.user 中

**相关代码位置：** `src/modules/auth/strategy/github.strategy.ts`

