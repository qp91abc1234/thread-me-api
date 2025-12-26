export function getControllerPath(controllerClass: any): string {
  const path = Reflect.getMetadata('path', controllerClass);
  if (!path) return '/';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized === '/' ? '/' : normalized.replace(/\/+$/, '');
}

export function buildFullPath(
  controllerPath: string,
  methodPath: string | null,
): string {
  if (!methodPath || methodPath === '/') {
    return controllerPath;
  }

  // 规范化方法路径
  const normalizedMethodPath = methodPath.startsWith('/')
    ? methodPath
    : `/${methodPath}`;

  return `${controllerPath}${normalizedMethodPath}`;
}
