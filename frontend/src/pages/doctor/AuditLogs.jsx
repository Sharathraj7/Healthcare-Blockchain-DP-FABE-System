import React, { useEffect, useState } from 'react'
import { Table, Card, Tag, Space, Typography, Tooltip } from 'antd'
import { doctorAPI } from '../../services/api.js'

const { Title, Text } = Typography

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    doctorAPI.getAuditLogs().then(res => {
      setLogs(res.data.data.logs)
    }).finally(() => setLoading(false))
  }, [])

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: text => new Date(text).toLocaleString(),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: text => {
        let color = 'blue'
        if (text.includes('DENIED')) color = 'red'
        if (text.includes('CREATED') || text.includes('REGISTERED')) color = 'green'
        return <Tag color={color}>{text.replace(/_/g, ' ')}</Tag>
      },
    },
    {
      title: 'Actor',
      key: 'actor',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: '#f1f5f9' }}>{record.actorRole}</Text>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{record.actorId.slice(0, 8)}...</Text>
        </Space>
      ),
    },
    {
      title: 'Target Record/Patient',
      key: 'target',
      render: (_, record) => {
        if (record.recordId) return <Tooltip title={record.recordId}><Text code className="hash-text">REC: {record.recordId.slice(0, 8)}...</Text></Tooltip>
        if (record.patientId) return <Tooltip title={record.patientId}><Text code className="hash-text">PAT: {record.patientId.slice(0, 8)}...</Text></Tooltip>
        return '—'
      },
    },
    {
      title: 'Result',
      dataIndex: 'success',
      key: 'success',
      render: success => (
        <Tag color={success ? 'success' : 'error'}>
          {success ? 'SUCCESS' : 'FAILED'}
        </Tag>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: text => <Text type="secondary">{text}</Text>
    },
  ]

  return (
    <div className="page-container">
      <div className="section-header">
        <h2>Security Audit Logs</h2>
        <p>Immutable record of all access requests and system events.</p>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          size="middle"
        />
      </Card>
    </div>
  )
}
