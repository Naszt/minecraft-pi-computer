import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '模块化 π 计算机 · 架构可视化',
  description: '用于理解和协作搭建 Minecraft 红石 π 水龙头计算机的交互式架构图。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
