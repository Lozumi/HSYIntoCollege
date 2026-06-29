import React from 'react';
import { VetradocsChat, VetradocsFloatingBar } from 'vetradocs-docusaurus';
import 'vetradocs-docusaurus/dist/theme/VetradocsChat/styles.css';
import 'vetradocs-docusaurus/dist/theme/VetradocsFloatingBar/styles.css';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Root({ children }) {
  const { siteConfig } = useDocusaurusContext();
  const endpoint = siteConfig.customFields?.chatApiEndpoint;
  const indexPath = siteConfig.customFields?.chatIndexPath;
  return (
    <>
      {children}
      <VetradocsFloatingBar
        apiEndpoint={endpoint}
        indexPath={indexPath}
        placeholder="问一个关于高校指南的问题..."
        accentColor="#f97316"
      />
      <VetradocsChat
        apiEndpoint={endpoint}
        indexPath={indexPath}
        title="AI 问答助手"
        placeholder="输入你的问题..."
        accentColor="#f97316"
      />
    </>
  );
}
