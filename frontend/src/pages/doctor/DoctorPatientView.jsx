import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Table, Tag, Button, Typography, Space, message, Modal, Alert, Spin } from 'antd'
import { LockOutlined, UnlockOutlined, SafetyCertificateOutlined, LeftOutlined, DownloadOutlined } from '@ant-design/icons'
import { doctorAPI } from '../../services/api.js'

const { Title, Text } = Typography

export default function DoctorPatientView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requestingAccess, setRequestingAccess] = useState(false)
  const [decryptedRecord, setDecryptedRecord] = useState(null)

  useEffect(() => {
    doctorAPI.getPatient(id)
      .then(res => setPatient(res.data.data))
      .catch(err => {
        message.error('Failed to load patient data')
        navigate('/doctor/patients')
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleRequestAccess = async (recordId) => {
    setRequestingAccess(true)
    try {
      const res = await doctorAPI.requestAccess(recordId)
      
      if (res.data.data.accessGranted) {
        message.success('Access granted and record decrypted successfully')
        setDecryptedRecord(res.data.data)
      }
    } catch (err) {
      if (err.response?.status === 403) {
        message.error('DP-FABE Access Denied: Your attributes do not satisfy the policy')
      } else {
        message.error('Failed to decrypt record')
      }
    } finally {
      setRequestingAccess(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  if (!patient) return null

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
      render: () => <Tag color="green"><LockOutlined /> Encrypted</Tag>,
    },
    {
      title: 'Policy',
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
          icon={<UnlockOutlined />}
          onClick={() => handleRequestAccess(record.id)}
          loading={requestingAccess}
          style={{ background: 'linear-gradient(135deg, #00c6a9, #1a73e8)', border: 'none' }}
        >
          Decrypt & View
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Button 
        type="text" 
        icon={<LeftOutlined />} 
        onClick={() => navigate('/doctor/patients')}
        style={{ color: '#94a3b8', marginBottom: 24, paddingLeft: 0 }}
      >
        Back to Directory
      </Button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'rgba(0, 198, 169, 0.1)', color: '#00c6a9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 'bold'
        }}>
          {patient.patient.name.charAt(0)}
        </div>
        <div>
          <Title level={3} style={{ color: '#f1f5f9', margin: 0, fontFamily: 'Outfit' }}>
            {patient.patient.name}
          </Title>
          <Text style={{ color: '#64748b' }}>
            Patient ID: <Text code>{patient.patient.id}</Text>
          </Text>
        </div>
      </div>

      <Card title={<span style={{ color: '#f1f5f9' }}>Public Profile</span>} style={{ marginBottom: 24 }}>
        <Descriptions column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }} labelStyle={{ color: '#94a3b8' }} contentStyle={{ color: '#f1f5f9' }}>
          <Descriptions.Item label="Age">{patient.patient.age || '—'}</Descriptions.Item>
          <Descriptions.Item label="Gender"><span style={{ textTransform: 'capitalize' }}>{patient.patient.gender}</span></Descriptions.Item>
          <Descriptions.Item label="Blood Group">{patient.patient.bloodGroup || '—'}</Descriptions.Item>
          <Descriptions.Item label="Height">{patient.patient.height ? `${patient.patient.height} cm` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Weight">{patient.patient.weight ? `${patient.patient.weight} kg` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Primary Condition">
            {patient.patient.diseaseType ? <Tag color="blue">{patient.patient.diseaseType}</Tag> : '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={
        <Space>
          <LockOutlined style={{ color: '#10b981' }} />
          <span style={{ color: '#f1f5f9' }}>Encrypted Medical Records</span>
        </Space>
      }>
        <Table
          columns={columns}
          dataSource={patient.records}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Decrypted Record Modal */}
      <Modal
        title={
          <Space>
            <UnlockOutlined style={{ color: '#00c6a9' }} />
            <span style={{ color: '#f1f5f9' }}>Decrypted Medical Record</span>
          </Space>
        }
        open={!!decryptedRecord}
        onCancel={() => setDecryptedRecord(null)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDecryptedRecord(null)}>Close</Button>
        ]}
      >
        {decryptedRecord && (
          <div>
            <Alert
              message="DP-FABE Access Granted"
              description={
                <div>
                  <div style={{ marginBottom: 4 }}>Your attributes successfully satisfied the record's policy.</div>
                  <div>Granted Privilege: <Tag color="blue">{decryptedRecord.privilege}</Tag></div>
                </div>
              }
              type="success"
              showIcon
              icon={<SafetyCertificateOutlined />}
              style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: 24 }}
            />

            <Descriptions bordered column={1} labelStyle={{ background: 'rgba(255,255,255,0.02)', color: '#94a3b8', width: 200 }} contentStyle={{ color: '#f1f5f9' }}>
              <Descriptions.Item label="Disease / Condition">{decryptedRecord.medicalData.diseaseType || '—'}</Descriptions.Item>
              <Descriptions.Item label="Clinical Notes / Medical History">
                <div style={{ whiteSpace: 'pre-wrap' }}>{decryptedRecord.medicalData.medicalHistory || '—'}</div>
              </Descriptions.Item>
              <Descriptions.Item label="Prescribed Medications">
                <div style={{ whiteSpace: 'pre-wrap' }}>{decryptedRecord.medicalData.medications || '—'}</div>
              </Descriptions.Item>
              <Descriptions.Item label="Allergies">{decryptedRecord.medicalData.allergies || '—'}</Descriptions.Item>
              
              {decryptedRecord.medicalData.fileMetadata && (
                <Descriptions.Item label="Attached Report">
                  <Space direction="vertical">
                    <Text style={{ color: '#f1f5f9' }}>{decryptedRecord.medicalData.fileMetadata.originalName}</Text>
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />} 
                      size="small"
                      onClick={() => {
                        // Create a blob from base64 and download
                        const content = decryptedRecord.medicalData.fileData;
                        const byteCharacters = atob(content);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: decryptedRecord.medicalData.fileMetadata.mimeType });
                        
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = decryptedRecord.medicalData.fileMetadata.originalName;
                        link.click();
                      }}
                    >
                      Download Decrypted File
                    </Button>
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                An audit log has been created for this access request on the blockchain.
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
