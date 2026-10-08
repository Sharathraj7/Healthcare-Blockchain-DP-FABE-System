import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Modal, Typography, Card, Descriptions } from 'antd'
import { LockOutlined, EyeOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import { patientAPI } from '../../services/api.js'

const { Title, Text } = Typography

export default function PatientRecords() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewModal, setViewModal] = useState({ visible: false, record: null })

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const res = await patientAPI.getRecords()
      setRecords(res.data.data.records)
    } catch (err) {
      // handled by interceptor or silent fail
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (id) => {
    try {
      const res = await patientAPI.getRecord(id)
      setViewModal({ visible: true, record: res.data.data })
    } catch (err) {
      //
    }
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: text => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'encryptionStatus',
      key: 'encryptionStatus',
      render: status => (
        <Tag color="green" style={{ borderRadius: 6 }}>
          <LockOutlined /> {status}
        </Tag>
      ),
    },
    {
      title: 'Blockchain Block',
      dataIndex: 'blockIndex',
      key: 'blockIndex',
      render: val => <Text strong>#{val}</Text>,
    },
    {
      title: 'Access Policy',
      dataIndex: 'policyExpression',
      key: 'policyExpression',
      render: text => <Text code>{text}</Text>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          ghost 
          icon={<EyeOutlined />} 
          size="small"
          onClick={() => handleView(record.id)}
        >
          View Metadata
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="section-header">
        <h2>My Medical Records</h2>
        <p>View your encrypted medical history stored on the blockchain.</p>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={<span><LockOutlined style={{ color: '#10b981', marginRight: 8 }} /> Encrypted Record Metadata</span>}
        open={viewModal.visible}
        onCancel={() => setViewModal({ visible: false, record: null })}
        footer={[
          <Button key="close" onClick={() => setViewModal({ visible: false, record: null })}>
            Close
          </Button>
        ]}
        width={700}
      >
        {viewModal.record && (
          <div>
            <div style={{ background: 'rgba(26, 115, 232, 0.05)', padding: '16px', borderRadius: 8, marginBottom: 24, border: '1px solid rgba(26, 115, 232, 0.2)' }}>
              <Text style={{ color: '#f1f5f9' }}>
                This record is fully encrypted. You are viewing the public metadata stored on the blockchain. 
                Only authorized doctors matching the access policy can decrypt the actual medical contents.
              </Text>
            </div>

            <Descriptions bordered column={1} size="small" labelStyle={{ background: 'rgba(255,255,255,0.02)', color: '#94a3b8', width: 180 }}>
              <Descriptions.Item label="Record ID"><Text code>{viewModal.record.id}</Text></Descriptions.Item>
              <Descriptions.Item label="Creation Date">{new Date(viewModal.record.createdAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Encryption Status">
                <Tag color="success"><CheckCircleOutlined /> {viewModal.record.encryptionStatus}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Access Policy"><Text code>{viewModal.record.policyExpression}</Text></Descriptions.Item>
              <Descriptions.Item label="Attached File">
                {viewModal.record.hasFile ? (
                  <Space>
                    <FileTextOutlined style={{ color: '#1a73e8' }} /> 
                    <Text>{viewModal.record.fileMetadata?.originalName}</Text>
                    <Text type="secondary">({Math.round(viewModal.record.fileMetadata?.size / 1024)} KB)</Text>
                  </Space>
                ) : 'None'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Blockchain Info">
                <div style={{ marginBottom: 4 }}><Text type="secondary">Block:</Text> #{viewModal.record.blockIndex}</div>
                <div style={{ marginBottom: 4 }}><Text type="secondary">Txn ID:</Text> <Text code className="hash-text">{viewModal.record.transactionId}</Text></div>
                <div><Text type="secondary">Block Hash:</Text> <Text code className="hash-text">{viewModal.record.blockHash}</Text></div>
              </Descriptions.Item>
              
              <Descriptions.Item label="IPFS Storage (Simulated)">
                <div style={{ marginBottom: 4 }}><Text type="secondary">Data CID:</Text> <Text code className="hash-text">{viewModal.record.ipfsCid}</Text></div>
                {viewModal.record.fileIpfsCid && (
                  <div><Text type="secondary">File CID:</Text> <Text code className="hash-text">{viewModal.record.fileIpfsCid}</Text></div>
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}
