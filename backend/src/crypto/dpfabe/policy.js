/**
 * DP-FABE Policy Engine
 * 
 * Implements access policy evaluation for the FULL_READ privilege branch.
 * 
 * IMPLEMENTATION STATUS: SIMULATED_PROTOTYPE
 * In a formally secure DP-FABE, policy enforcement would be cryptographically
 * enforced through CP-ABE. Here it is implemented as policy evaluation logic.
 * 
 * Supported policy expressions:
 * - "ROLE == DOCTOR"
 * - "ROLE == DOCTOR AND SPECIALIZATION == CARDIOLOGIST"
 * - "ROLE == DOCTOR OR SPECIALIZATION == NEUROLOGIST"
 */

const { POLICY_OPERATORS, ACCESS_RESULT } = require('./types');

/**
 * Parse and evaluate a policy expression against doctor attributes
 * 
 * @param {string} policyExpression - Policy string to evaluate
 * @param {Object} doctorAttributes - Doctor's attributes {role, specialization, hospital}
 * @returns {boolean} Whether attributes satisfy the policy
 */
function evaluatePolicy(policyExpression, doctorAttributes) {
  if (!policyExpression || !doctorAttributes) {
    return false;
  }
  
  try {
    // Handle AND conditions
    if (policyExpression.includes(' AND ')) {
      const parts = policyExpression.split(' AND ');
      return parts.every(part => evaluateSingleCondition(part.trim(), doctorAttributes));
    }
    
    // Handle OR conditions
    if (policyExpression.includes(' OR ')) {
      const parts = policyExpression.split(' OR ');
      return parts.some(part => evaluateSingleCondition(part.trim(), doctorAttributes));
    }
    
    // Single condition
    return evaluateSingleCondition(policyExpression.trim(), doctorAttributes);
  } catch (err) {
    console.error('[DP-FABE Policy] Error evaluating policy:', err.message);
    return false;
  }
}

/**
 * Evaluate a single policy condition
 * 
 * @param {string} condition - Single condition e.g. "ROLE == DOCTOR"
 * @param {Object} attributes - Doctor attributes
 * @returns {boolean}
 */
function evaluateSingleCondition(condition, attributes) {
  const match = condition.match(/^(\w+)\s*==\s*(\w+)$/);
  if (!match) {
    console.warn('[DP-FABE Policy] Unrecognized condition format:', condition);
    return false;
  }
  
  const [, attrKey, expectedValue] = match;
  const attrKeyLower = attrKey.toLowerCase();
  
  const actualValue = attributes[attrKeyLower] ||
    attributes[attrKey] ||
    attributes[attrKey.toUpperCase()];
  
  if (actualValue === undefined) {
    return false;
  }
  
  return String(actualValue).toUpperCase() === String(expectedValue).toUpperCase();
}

/**
 * Check if a doctor can access a record
 * 
 * @param {Object} doctorAttributes - Doctor's attributes
 * @param {Object} recordPolicy - Record's access policy
 * @returns {Object} Access result with decision and reason
 */
function canAccessRecord(doctorAttributes, recordPolicy) {
  if (!doctorAttributes) {
    return {
      result: ACCESS_RESULT.DENIED,
      reason: 'No doctor attributes provided',
      satisfied: false,
    };
  }
  
  if (!recordPolicy || !recordPolicy.expression) {
    // Default policy: any doctor can access
    if (doctorAttributes.role === 'DOCTOR') {
      return {
        result: ACCESS_RESULT.GRANTED,
        reason: 'Default policy: ROLE == DOCTOR satisfied',
        satisfied: true,
      };
    }
    return {
      result: ACCESS_RESULT.DENIED,
      reason: 'Role is not DOCTOR',
      satisfied: false,
    };
  }
  
  const satisfied = evaluatePolicy(recordPolicy.expression, doctorAttributes);
  
  return {
    result: satisfied ? ACCESS_RESULT.GRANTED : ACCESS_RESULT.DENIED,
    reason: satisfied
      ? `Policy satisfied: ${recordPolicy.expression}`
      : `Policy not satisfied: ${recordPolicy.expression}`,
    satisfied,
    policyExpression: recordPolicy.expression,
    evaluatedAttributes: {
      role: doctorAttributes.role,
      specialization: doctorAttributes.specialization,
    },
  };
}

/**
 * Create a standard access policy object
 * 
 * @param {string} expression - Policy expression
 * @param {string} [description] - Human-readable description
 * @returns {Object} Policy object
 */
function createPolicy(expression, description = null) {
  return {
    expression,
    description: description || `Access requires: ${expression}`,
    createdAt: new Date().toISOString(),
    version: '1.0',
    implementationNote: 'SIMULATED_PROTOTYPE - Phase 2 will use CP-ABE cryptographic enforcement',
  };
}

/**
 * Standard policies
 */
const STANDARD_POLICIES = {
  ANY_DOCTOR: createPolicy('ROLE == DOCTOR', 'Any verified doctor can access'),
  CARDIOLOGIST: createPolicy(
    'ROLE == DOCTOR AND SPECIALIZATION == CARDIOLOGIST',
    'Requires cardiologist specialization'
  ),
  NEUROLOGIST: createPolicy(
    'ROLE == DOCTOR AND SPECIALIZATION == NEUROLOGIST',
    'Requires neurologist specialization'
  ),
  GENERAL_OR_CARDIO: createPolicy(
    'SPECIALIZATION == GENERAL OR SPECIALIZATION == CARDIOLOGIST',
    'Accessible by general practitioners or cardiologists'
  ),
};

module.exports = {
  evaluatePolicy,
  evaluateSingleCondition,
  canAccessRecord,
  createPolicy,
  STANDARD_POLICIES,
};
