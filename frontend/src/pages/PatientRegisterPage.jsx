import React, { useState } from 'react'
import { Form, Input, Button, Select, Row, Col, Typography, Steps, Space, Divider, message, Alert, Upload } from 'antd'
import { UserOutlined, LockOutlined, HeartOutlined, FileOutlined, LeftOutlined, InboxOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const { Title, Text } = Typography
const { Option } = Select
const { Dragger } = Upload

const steps = [
  { title: 'Personal Info', icon: <UserOutlined /> },
  { title: 'Medical Info', icon: <HeartOutlined /> },
  { title: 'Documents', icon: <FileOutlined /> },
]

export default function PatientRegisterPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({})
  const [fileList, setFileList] = useState([])
  const [form1] = Form.useForm()
  const [form2] = Form.useForm()
  const { login } = useAuth()
  const navigate = useNavigate()

  const next = async () => {
    try {
      if (currentStep === 0) {
        const vals = await form1.validateFields()
        setFormData(prev => ({ ...prev, ...vals }))
      } else if (currentStep === 1) {
        const vals = await form2.validateFields()
        setFormData(prev => ({ ...prev, ...vals }))
      }
      setCurrentStep(currentStep + 1)
    } catch {}
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') payload.append(k, v)
      })
      if (fileList.length > 0 && fileList[0].originFileObj) {
        payload.append('medicalReport', fileList[0].originFileObj)
      }

      // Use JSON for registration since file is optional
      const jsonPayload = { ...formData }
      const res = await authAPI.registerPatient(jsonPayload)
      const { patient, token } = res.data.data
      login(patient, token)
      message.success('Registration successful! Welcome to HealthChain.')
      navigate('/patient/dashboard')
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || 'Registration failed. Please try again.'
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#f1f5f9',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 720,
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Link to="/login">
            <Button type="text" icon={<LeftOutlined />} style={{ color: '#94a3b8', marginBottom: 16, paddingLeft: 0 }}>
              Back to Login
            </Button>
          </Link>
          <Title level={3} style={{ color: '#f1f5f9', margin: 0, fontFamily: 'Outfit' }}>
            Patient Registration
          </Title>
          <Text style={{ color: '#64748b' }}>Create your secure healthcare account</Text>
        </div>

        <Alert
          message="Secure Encryption Active"
          description="Your medical information will be encrypted with AES-256-GCM before storage."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 10,
            marginBottom: 28,
          }}
        />

        {/* Steps */}
        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 32 }}
        />

        {/* Step 1: Personal Info */}
        {currentStep === 0 && (
          <Form form={form1} layout="vertical" size="large">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="name" label={<span style={{ color: '#94a3b8' }}>Full Name</span>}
                  rules={[{ required: true, message: 'Full name required' }, { min: 2 }]}>
                  <Input prefix={<UserOutlined style={{ color: '#64748b' }} />} placeholder="Enter your full name" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="email" label={<span style={{ color: '#94a3b8' }}>Email Address</span>}
                  rules={[{ required: true, message: 'Email required' }, { type: 'email' }]}>
                  <Input placeholder="email@example.com" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="password" label={<span style={{ color: '#94a3b8' }}>Password</span>}
                  rules={[
                    { required: true, message: 'Password required' },
                    { min: 8, message: 'At least 8 characters' },
                    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must contain uppercase, lowercase, and number' },
                  ]}>
                  <Input.Password prefix={<LockOutlined style={{ color: '#64748b' }} />} placeholder="Min 8 chars, mixed case + number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="age" label={<span style={{ color: '#94a3b8' }}>Age</span>}
                  rules={[{ required: true, message: 'Age required' }]}>
                  <Input type="number" min={1} max={150} placeholder="Age in years" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="gender" label={<span style={{ color: '#94a3b8' }}>Gender</span>}
                  rules={[{ required: true, message: 'Gender required' }]}>
                  <Select placeholder="Select gender">
                    <Option value="male">Male</Option>
                    <Option value="female">Female</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="height" label={<span style={{ color: '#94a3b8' }}>Height (cm)</span>}
                  rules={[{ required: true, message: 'Height required' }]}>
                  <Input type="number" min={50} max={300} placeholder="Height in cm" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="weight" label={<span style={{ color: '#94a3b8' }}>Weight (kg)</span>}
                  rules={[{ required: true, message: 'Weight required' }]}>
                  <Input type="number" min={1} max={500} placeholder="Weight in kg" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="address" label={<span style={{ color: '#94a3b8' }}>Address</span>}>
                  <Input.TextArea rows={2} placeholder="Your address" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}

        {/* Step 2: Medical Info */}
        {currentStep === 1 && (
          <Form form={form2} layout="vertical" size="large">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="diseaseType" label={<span style={{ color: '#94a3b8' }}>Disease / Condition</span>}>
                  <Input placeholder="e.g., Diabetes, Hypertension" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="bloodGroup" label={<span style={{ color: '#94a3b8' }}>Blood Group</span>}>
                  <Select placeholder="Select blood group">
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <Option key={bg} value={bg}>{bg}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="allergies" label={<span style={{ color: '#94a3b8' }}>Known Allergies</span>}>
                  <Input.TextArea rows={2} placeholder="e.g., Penicillin, Aspirin (or None)" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="medicalHistory" label={<span style={{ color: '#94a3b8' }}>Medical History</span>}>
                  <Input.TextArea rows={3} placeholder="Previous conditions, surgeries, hospitalizations..." />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="medications" label={<span style={{ color: '#94a3b8' }}>Current Medications</span>}>
                  <Input.TextArea rows={2} placeholder="Current medications and dosages..." />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}

        {/* Step 3: Document Upload */}
        {currentStep === 2 && (
          <div>
            <Alert
              message="Encryption Notice"
              description="Your medical report will be encrypted with AES-256-GCM before upload. Plaintext files are never stored."
              type="info"
              showIcon
              style={{
                marginBottom: 20,
                background: 'rgba(26, 115, 232, 0.08)',
                border: '1px solid rgba(26, 115, 232, 0.2)',
                borderRadius: 10,
              }}
            />
            <Dragger
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false}
              accept=".pdf,.jpg,.jpeg,.png"
              maxCount={1}
              style={{ borderRadius: 12 }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#1a73e8', fontSize: 48 }} />
              </p>
              <p className="ant-upload-text" style={{ color: '#f1f5f9' }}>
                Click or drag medical report to upload
              </p>
              <p className="ant-upload-hint" style={{ color: '#64748b' }}>
                Supports: PDF, JPG, JPEG, PNG (max 10MB)
              </p>
            </Dragger>
            <div style={{ marginTop: 16, color: '#64748b', fontSize: 12, textAlign: 'center' }}>
              Medical report upload is optional. You can add records later from your dashboard.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          {currentStep > 0 ? (
            <Button onClick={() => setCurrentStep(currentStep - 1)} size="large">
              Previous
            </Button>
          ) : (
            <div />
          )}

          {currentStep < steps.length - 1 ? (
            <Button type="primary" onClick={next} size="large" style={{ minWidth: 120 }}>
              Next →
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              size="large"
              style={{ minWidth: 200 }}
              icon={<CheckCircleOutlined />}
            >
              {loading ? 'Registering...' : 'Create Account'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
