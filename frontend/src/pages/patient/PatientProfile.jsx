import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Select, Row, Col, Card, message, Typography, Divider } from 'antd'
import { UserOutlined, SaveOutlined } from '@ant-design/icons'
import { patientAPI } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'

const { Title } = Typography
const { Option } = Select

export default function PatientProfile() {
  const { user, login, token } = useAuth()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await patientAPI.getProfile()
      form.setFieldsValue(res.data.data)
    } catch (err) {
      message.error('Failed to load profile')
    } finally {
      setFetching(false)
    }
  }

  const handleUpdate = async (values) => {
    setLoading(true)
    try {
      const res = await patientAPI.updateProfile(values)
      // Update local context
      login({ ...user, ...res.data.data }, token)
      message.success('Profile updated successfully')
    } catch (err) {
      message.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <h2>My Profile</h2>
        <p>Manage your personal and basic medical information</p>
      </div>

      <Card loading={fetching}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
          size="large"
        >
          <Row gutter={24}>
            <Col span={24}>
              <Divider orientation="left" style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#1a73e8' }}>Personal Information</Divider>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="Email Address">
                <Input disabled />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item name="age" label="Age">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="gender" label="Gender">
                <Select>
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="bloodGroup" label="Blood Group">
                <Select>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <Option key={bg} value={bg}>{bg}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="height" label="Height (cm)">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="weight" label="Weight (kg)">
                <Input type="number" />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item name="address" label="Address">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Divider orientation="left" style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#1a73e8' }}>Medical Information</Divider>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="diseaseType" label="Primary Condition">
                <Input placeholder="e.g., Diabetes" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="allergies" label="Allergies">
                <Input placeholder="e.g., Penicillin" />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item name="medicalHistory" label="Medical History">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="medications" label="Current Medications">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                Save Changes
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  )
}
