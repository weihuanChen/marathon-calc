import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n.config';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // 匹配带语言前缀的路由
    '/(en|zh|fr|es)/:path*',
    // 匹配根路由和默认语言的路由（不带前缀）
    '/',
    // 匹配其他页面路由（排除静态资源和 API）
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
