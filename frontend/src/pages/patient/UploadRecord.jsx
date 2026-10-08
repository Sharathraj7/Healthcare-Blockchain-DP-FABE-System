import React, { useState } from 'react'
import { Form, Input, Button, Card, Upload, message, Alert, Select, Steps, Result, Typography, Divider, Row, Col } from 'antd'
import { InboxOutlined, LockOutlined, CloudUploadOutlined, CheckCircleOutlined, SecurityScanOutlined } from '@ant-design/icons'
import { patientAPI } from '../../services/api.js'
import { useNavigate } from 'react-router-dom'

const { Dragger } = Upload
const { Title, Text } = Typography

export default function UploadRecord() {
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  const handleUpload = async (values) => {
    setLoading(true)
    try {
      const data = { ...values }
      if (fileList.length > 0 && fileList[0].originFileObj) {
        data.medicalReport = fileList[0].originFileObj
      }

      const res = await patientAPI.createRecord(data)
      setResult(res.data.data)
      message.success('Medical record encrypted and stored successfully!')
    } catch (err) {
      message.error(err.response?.data?.error?.message || 'Failed to upload record')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="page-container">
        <Result
          status="success"
          title="Medical Record Secured!"
          subTitle={
            <div style={{ marginTop: 24, textAlign: 'left', maxWidth: 600, margin: '24px auto' }}>
              <Alert
                message="Encryption Successful"
                description="Your medical data has been encrypted with AES-256-GCM and stored on the simulated IPFS and Blockchain."
                type="success"
                showIcon
                style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: 24 }}
              />
              <Card size="small" title="Transaction Details" style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 8 }}><Text type="secondary">Record ID:</Text> <Text code>{result.recordId}</Text></div>
                <div style={{ marginBottom: 8 }}><Text type="secondary">Block #:</Text> <Text strong>{result.blockNumber}</Text></div>
                <div style={{ marginBottom: 8 }}><Text type="secondary">Transaction ID:</Text> <Text code className="hash-text">{result.transactionId}</Text></div>
                <div style={{ marginBottom: 8 }}><Text type="secondary">IPFS CID:</Text> <Text code className="hash-text">{result.ipfsCid}</Text></div>
                {result.fileIpfsCid && (
                  <div><Text type="secondary">File IPFS CID:</Text> <Text code className="hash-text">{result.fileIpfsCid}</Text></div>
                )}
              </Card>

              <Title level={5}>Security Workflow Execution</Title>
              <div style={{ background: '#111827', padding: 20, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                {result.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 12, opacity: step.status === 'SKIPPED' ? 0.5 : 1 }}>
                    <span style={{ color: step.status === 'COMPLETED' ? '#10b981' : '#64748b', marginRight: 12, fontSize: 16 }}>
                      {step.icon}
                    </span>
                    <Text style={{ color: '#f1f5f9' }}>{step.step}</Text>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>
                      {i === 0 ? `${result.metrics.encryptionTimeMs}ms` : ''}
                      {i === 2 ? `${result.metrics.dpfabePackagingTimeMs}ms` : ''}
                      {i === 3 ? `${result.metrics.ipfsTimeMs}ms` : ''}
                      {i === 4 ? `${result.metrics.blockchainTimeMs}ms` : ''}
                    </span>
                  </div>
                ))}
                <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.08)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#94a3b8' }}>Total Processing Time:</Text>
                  <Text style={{ color: '#1a73e8', fontWeight: 'bold' }}>{result.metrics.totalProcessingTimeMs}ms</Text>
                </div>
              </div>
            </div>
          }
          extra={[
            <Button type="primary" key="records" onClick={() => navigate('/patient/records')}>
              View My Records
            </Button>,
            <Button key="add" onClick={() => { setResult(null); form.resetFields(); setFileList([]) }}>
              Add Another Record
            </Button>,
          ]}
        />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <h2>Add Medical Record</h2>
        <p>Your medical information will be encrypted before storage.</p>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card>
            <Form form={form} layout="vertical" onFinish={handleUpload} size="large">
              <Alert
                message="End-to-End Encryption"
                description="All data entered here is encrypted using AES-256-GCM. The plaintext data will never be exposed on the blockchain or IPFS."
                type="info"
                showIcon
                icon={<LockOutlined />}
                style={{ marginBottom: 24, background: 'rgba(26, 115, 232, 0.08)', border: '1px solid rgba(26, 115, 232, 0.2)' }}
              />

              <Form.Item name="diseaseType" label="Disease / Condition" rules={[{ required: true }]}>
                <Input placeholder="e.g., Hypertension, Diabetes" />
              </Form.Item>

              <Form.Item name="medicalHistory" label="Clinical Notes / Medical History" rules={[{ required: true }]}>
                <Input.TextArea rows={4} placeholder="Describe the current condition, symptoms, and diagnosis..." />
              </Form.Item>

              <Form.Item name="medications" label="Prescribed Medications">
                <Input.TextArea rows={2} placeholder="List any medications prescribed during this visit" />
              </Form.Item>

              <Form.Item name="accessPolicy" label="Access Policy (DP-FABE Prototype)" initialValue="ANY_DOCTOR">
                <Select>
                  <Select.Option value="ANY_DOCTOR">Any Registered Doctor (ROLE == DOCTOR)</Select.Option>
                  <Select.Option value="CARDIOLOGIST">Cardiologists Only (SPECIALIZATION == CARDIOLOGIST)</Select.Option>
                  <Select.Option value="NEUROLOGIST">Neurologists Only (SPECIALIZATION == NEUROLOGIST)</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="Medical Report File (Optional)">
                <Dragger
                  fileList={fileList}
                  onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                  accept=".pdf,.jpg,.jpeg,.png"
                >
                  <p className="ant-upload-drag-icon">
                    <CloudUploadOutlined style={{ color: '#1a73e8' }} />
                  </p>
                  <p className="ant-upload-text" style={{ color: '#f1f5f9' }}>Click or drag file to this area to upload</p>
                  <p className="ant-upload-hint" style={{ color: '#64748b' }}>
                    Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files
                  </p>
                </Dragger>
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={loading} icon={<SecurityScanOutlined />} size="large" block>
                Encrypt & Store Record
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Security Workflow" size="small">
            <Steps
              direction="vertical"
              current={0}
              items={[
                { title: 'Data Entry', description: 'Input medical details' },
                { title: 'AES-256-GCM', description: 'Data & file encryption' },
                { title: 'DP-FABE', description: 'Dual-privilege policy binding' },
                { title: 'IPFS Storage', description: 'Store encrypted payload' },
                { title: 'Blockchain', description: 'Record transaction & hash' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
