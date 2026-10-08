import React, { useEffect, useState } from 'react'
import { Card, Typography, Row, Col, Statistic, Space, Button, Alert, Tag, Collapse, Timeline } from 'antd'
import { BlockOutlined, SyncOutlined, CheckCircleOutlined, SafetyCertificateOutlined, NodeIndexOutlined } from '@ant-design/icons'
import { blockchainAPI } from '../services/api.js'

const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse

export default function BlockchainExplorer() {
  const [blocks, setBlocks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [blocksRes, statsRes] = await Promise.all([
        blockchainAPI.getBlocks(),
        blockchainAPI.getStats()
      ])
      setBlocks(blocksRes.data.data.blocks.reverse()) // show newest first
      setStats(statsRes.data.data)
    } catch (err) {
      //
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    setValidating(true)
    try {
      const res = await blockchainAPI.validate()
      setValidationResult(res.data.data)
    } catch (err) {
      setValidationResult({ isValid: false, issues: ['Failed to validate blockchain'] })
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <h2>Blockchain Explorer</h2>
          <p>Real-time view of the simulated healthcare blockchain network.</p>
        </div>
        <Space>
          <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading}>
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<SafetyCertificateOutlined />} 
            onClick={handleValidate} 
            loading={validating}
            style={{ background: 'linear-gradient(135deg, #00c6a9, #1a73e8)', border: 'none' }}
          >
            Validate Chain Integrity
          </Button>
        </Space>
      </div>

      {validationResult && (
        <Alert
          message={validationResult.isValid ? "Blockchain is Valid" : "Blockchain Integrity Compromised"}
          description={
            validationResult.isValid 
              ? `Successfully verified ${validationResult.blockCount} blocks. Cryptographic hashes and linkages are intact.`
              : `Found issues: ${validationResult.issues.join(', ')}`
          }
          type={validationResult.isValid ? "success" : "error"}
          showIcon
          style={{ marginBottom: 24, borderRadius: 8 }}
          action={
            <Button size="small" type="text" onClick={() => setValidationResult(null)}>Dismiss</Button>
          }
        />
      )}

      {stats && (
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card bodyStyle={{ padding: 20 }} style={{ background: '#111827', borderColor: 'rgba(255,255,255,0.08)' }}>
              <Statistic 
                title={<span style={{ color: '#94a3b8' }}>Total Blocks</span>} 
                value={stats.totalBlocks} 
                prefix={<BlockOutlined style={{ color: '#1a73e8' }} />} 
                valueStyle={{ color: '#f1f5f9' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bodyStyle={{ padding: 20 }} style={{ background: '#111827', borderColor: 'rgba(255,255,255,0.08)' }}>
              <Statistic 
                title={<span style={{ color: '#94a3b8' }}>Total Transactions</span>} 
                value={stats.totalTransactions} 
                prefix={<NodeIndexOutlined style={{ color: '#00c6a9' }} />} 
                valueStyle={{ color: '#f1f5f9' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bodyStyle={{ padding: 20 }} style={{ background: '#111827', borderColor: 'rgba(255,255,255,0.08)' }}>
              <Statistic 
                title={<span style={{ color: '#94a3b8' }}>Consensus Algorithm</span>} 
                value="Proof of Work" 
                prefix={<CheckCircleOutlined style={{ color: '#7c4dff' }} />} 
                valueStyle={{ color: '#f1f5f9', fontSize: 18, marginTop: 10 }}
              />
              <Text style={{ color: '#64748b', fontSize: 12 }}>Difficulty: 2</Text>
            </Card>
          </Col>
        </Row>
      )}

      <Card title={<span style={{ color: '#f1f5f9' }}>Block Ledger</span>}>
        <Timeline mode="alternate">
          {blocks.map((block) => (
            <Timeline.Item 
              key={block.hash}
              color={block.index === 0 ? 'purple' : 'blue'}
              label={<Text style={{ color: '#94a3b8' }}>{new Date(block.timestamp).toLocaleString()}</Text>}
            >
              <div className="blockchain-block">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Space>
                    <Tag color={block.index === 0 ? "purple" : "blue"} style={{ borderRadius: 4, fontWeight: 'bold' }}>
                      Block #{block.index}
                    </Tag>
                    {block.index === 0 && <Tag color="magenta">Genesis Block</Tag>}
                  </Space>
                  <Text style={{ color: '#64748b', fontSize: 11 }}>
                    {block.transactions.length} txns
                  </Text>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 4, marginBottom: 8 }}>
                  <Text style={{ color: '#64748b', fontSize: 10, display: 'block' }}>BLOCK HASH</Text>
                  <Text code className="hash-text" style={{ color: '#00c6a9' }}>{block.hash}</Text>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 4, marginBottom: 12 }}>
                  <Text style={{ color: '#64748b', fontSize: 10, display: 'block' }}>PREVIOUS HASH</Text>
                  <Text code className="hash-text">{block.previousHash}</Text>
                </div>
                
                <Collapse ghost>
                  <Panel header={<Text style={{ color: '#1a73e8' }}>View Transactions ({block.transactions.length})</Text>} key="1">
                    {block.transactions.map((tx, i) => (
                      <div key={tx.transactionId || i} style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        padding: 12, 
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.05)',
                        marginBottom: 8
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Tag color="cyan">{tx.type}</Tag>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>
                            {new Date(tx.timestamp).toLocaleString()}
                          </Text>
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>TXN ID: </Text>
                          <Text code className="hash-text">{tx.transactionId}</Text>
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>ACTOR: </Text>
                          <Text code className="hash-text">{tx.actorId}</Text>
                        </div>
                        {tx.patientId && (
                          <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>PATIENT: </Text>
                            <Text code className="hash-text">{tx.patientId}</Text>
                          </div>
                        )}
                        {tx.metadata && Object.keys(tx.metadata).length > 0 && (
                          <div style={{ marginTop: 8, background: '#000', padding: 8, borderRadius: 4 }}>
                            <pre style={{ margin: 0, fontSize: 10, color: '#10b981', overflowX: 'auto' }}>
                              {JSON.stringify(tx.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </Panel>
                </Collapse>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  )
}
