import React, { useEffect, useState } from 'react'
import { Table, Input, Card, Button, Typography, Tag, Space } from 'antd'
import { SearchOutlined, EyeOutlined, MedicineBoxOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { doctorAPI } from '../../services/api.js'

const { Title, Text } = Typography

export default function DoctorPatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    doctorAPI.getPatients().then(res => {
      setPatients(res.data.data.patients)
    }).finally(() => setLoading(false))
  }, [])

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchText.toLowerCase()) || 
    p.email.toLowerCase().includes(searchText.toLowerCase()) ||
    (p.diseaseType && p.diseaseType.toLowerCase().includes(searchText.toLowerCase()))
  )

  const columns = [
    {
      title: 'Patient Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(0, 198, 169, 0.1)', color: '#00c6a9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {text.charAt(0)}
          </div>
          <Text style={{ color: '#f1f5f9', fontWeight: 500 }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: text => <span style={{ textTransform: 'capitalize' }}>{text}</span>
    },
    {
      title: 'Condition',
      dataIndex: 'diseaseType',
      key: 'diseaseType',
      render: text => text ? <Tag color="blue">{text}</Tag> : <Text type="secondary">—</Text>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          ghost
          icon={<EyeOutlined />}
          onClick={() => navigate(`/doctor/patients/${record.id}`)}
          style={{ borderColor: 'rgba(0,198,169,0.4)', color: '#00c6a9' }}
        >
          View Profile
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2>Patient Directory</h2>
          <p>Search and access authorized patient medical records.</p>
        </div>
        <Input
          placeholder="Search by name, email or condition..."
          prefix={<SearchOutlined style={{ color: '#64748b' }} />}
          style={{ width: 300 }}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredPatients}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
