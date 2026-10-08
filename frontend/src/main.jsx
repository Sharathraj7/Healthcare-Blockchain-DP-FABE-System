import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import App from './App.jsx'
import './index.css'

const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#1a73e8',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#1a73e8',
    colorBgBase: '#0a0e1a',
    colorBgContainer: '#111827',
    colorBgElevated: '#1a2333',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontSize: 14,
    colorText: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
  },
  components: {
    Layout: {
      siderBg: '#111827',
      bodyBg: '#0a0e1a',
      headerBg: '#111827',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(26, 115, 232, 0.15)',
      darkItemColor: '#94a3b8',
      darkItemHoverColor: '#f1f5f9',
    },
    Card: {
      colorBgContainer: '#111827',
    },
    Table: {
      colorBgContainer: 'transparent',
      headerBg: 'rgba(255, 255, 255, 0.04)',
    },
    Input: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
    },
    Select: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
    },
    Button: {
      colorPrimary: '#1a73e8',
    },
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={darkTheme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
