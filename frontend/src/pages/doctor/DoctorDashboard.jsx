import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Typography, Space, Button, List, Tag } from 'antd'
import { TeamOutlined, AuditOutlined, SecurityScanOutlined, FileProtectOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { doctorAPI } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'

const { Title, Text } = Typography

export default function DoctorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalPatients: 0, accessedRecords: 0, recentPatients: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    doctorAPI.getDashboard().then(res => {
      setStats(res.data.data)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <div style={{ marginBottom: 32, animation: 'fadeInUp 0.4s ease' }}>
        <Title level={3} style={{ color: '#f1f5f9', margin: 0, fontFamily: 'Outfit' }}>
          Doctor Dashboard
        </Title>
        <Text style={{ color: '#64748b' }}>
          Welcome to the secure HealthChain portal, Dr. {user?.name?.split(' ')[1] || user?.name}
        </Text>
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {[
          {
            title: 'Accessible Patients',
            value: stats.totalPatients,
            color: '#00c6a9',
            icon: <TeamOutlined style={{ fontSize: 24, color: '#00c6a9' }} />,
          },
          {
            title: 'Records Accessed',
            value: stats.accessedRecords,
            color: '#1a73e8',
            icon: <FileProtectOutlined style={{ fontSize: 24, color: '#1a73e8' }} />,
          },
          {
            title: 'Security Clearance',
            value: user?.specialization || 'DOCTOR',
            color: '#7c4dff',
            icon: <SecurityScanOutlined style={{ fontSize: 24, color: '#7c4dff' }} />,
            isText: true
          },
        ].map((stat, i) => (
          <Col xs={24} sm={8} key={i}>
            <div className="stat-card" style={{ borderTop: `2px solid ${stat.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>{stat.title}</Text>
                {stat.icon}
              </div>
              <div style={{ fontSize: stat.isText ? 24 : 36, fontWeight: 800, color: stat.color, lineHeight: 1.2 }}>
                {loading ? '—' : stat.value}
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card 
            title={<span style={{ color: '#f1f5f9' }}>Recent Patients</span>}
            extra={<Button type="link" onClick={() => navigate('/doctor/patients')} style={{ color: '#00c6a9' }}>View All</Button>}
          >
            <List
              loading={loading}
              itemLayout="horizontal"
              dataSource={stats.recentPatients}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button type="text" onClick={() => navigate(`/doctor/patients/${item.id}`)}>
                      <RightOutlined style={{ color: '#00c6a9' }} />
                    </Button>
                  ]}
                  style={{ borderBottomColor: 'rgba(255,255,255,0.06)' }}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: 'rgba(0, 198, 169, 0.1)', border: '1px solid rgba(0, 198, 169, 0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00c6a9'
                      }}>
                        <TeamOutlined />
                      </div>
                    }
                    title={<span style={{ color: '#f1f5f9' }}>{item.name}</span>}
                    description={
                      <Space>
                        <Text style={{ color: '#64748b', fontSize: 12 }}>{item.age} yrs • {item.gender}</Text>
                        <Tag color="blue" style={{ borderRadius: 10, fontSize: 10 }}>{item.diseaseType}</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={<span style={{ color: '#f1f5f9' }}>DP-FABE Authorization</span>}>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>Your Attribute Keys:</Text>
            </div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Text style={{ color: '#64748b', fontSize: 11, display: 'block' }}>ROLE</Text>
                <Text style={{ color: '#00c6a9', fontWeight: 600 }}>{user?.role}</Text>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Text style={{ color: '#64748b', fontSize: 11, display: 'block' }}>SPECIALIZATION</Text>
                <Text style={{ color: '#00c6a9', fontWeight: 600 }}>{user?.specialization}</Text>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Text style={{ color: '#64748b', fontSize: 11, display: 'block' }}>HOSPITAL</Text>
                <Text style={{ color: '#00c6a9', fontWeight: 600 }}>{user?.hospital}</Text>
              </div>
            </Space>
            
            <div style={{ marginTop: 24, padding: 12, background: 'rgba(124, 77, 255, 0.1)', borderRadius: 8, border: '1px solid rgba(124, 77, 255, 0.2)' }}>
              <Text style={{ color: '#7c4dff', fontSize: 12 }}>
                These attributes are mathematically evaluated against a patient's access policy during decryption.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
