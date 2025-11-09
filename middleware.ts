import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n.config';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // 优化: 只匹配 locale 前缀的路由，减少中间件执行频率
    '/(en|zh|fr|es)/:path*',
    // 匹配根路由
    '/',
  ],
};
