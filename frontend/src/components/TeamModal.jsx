import { useState } from 'react'
import { projectsAPI } from '../services/api'
import './TeamModal.css'

const TeamModal = ({ project, onClose, onUpdate }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddMember = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await projectsAPI.addMember(project._id, email)
      onUpdate(response.data)
      setEmail('')
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    try {
      const response = await projectsAPI.removeMember(project._id, userId)
      onUpdate(response.data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to remove member')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content team-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Team Members</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleAddMember} className="add-member-form">
          <div className="form-group">
            <label>Invite by Email</label>
            <div className="input-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
              />
              <button type="submit" disabled={loading} className="btn-add">
                {loading ? 'Adding...' : 'Invite'}
              </button>
            </div>
            {error && <p className="error-message">{error}</p>}
          </div>
        </form>

        <div className="members-list">
          <h3>Current Members ({project.members?.length || 0})</h3>
          {project.members && project.members.length > 0 ? (
            <div className="member-items">
              {project.members.map((member) => (
                <div key={member._id} className="member-item">
                  <div className="member-avatar">
                    {member.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="member-info">
                    <p className="member-name">{member.name}</p>
                    <p className="member-email">{member.email}</p>
                  </div>
                  {project.createdBy !== member._id && (
                    <button
                      className="btn-remove"
                      onClick={() => handleRemoveMember(member._id)}
                    >
                      Remove
                    </button>
                  )}
                  {project.createdBy === member._id && (
                    <span className="owner-badge">Owner</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-members">No members yet. Invite someone to collaborate!</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamModal
