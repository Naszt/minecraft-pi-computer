import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '模块化 π 计算机 · 架构可视化',
  description: '从数学原理、交互式架构到 ALU 与内存模块设计，理解并协作搭建 Minecraft 红石 π 水龙头计算机。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
