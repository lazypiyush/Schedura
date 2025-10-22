import { UserButton, useUser } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { projectsAPI } from '../services/api'
import ProjectModal from '../components/ProjectModal'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useUser()
  useAuth() // Sync with backend
  
  const [isDark, setIsDark] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setIsDark(savedTheme === 'dark')
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  // Detect user change and refresh data
useEffect(() => {
  if (user?.id) {
    const storedUserId = localStorage.getItem('lastUserId');
    
    // Check if user changed
    if (storedUserId && storedUserId !== user.id) {
      console.log('🔄 User changed! Reloading page...');
      localStorage.setItem('lastUserId', user.id);
      localStorage.removeItem('token'); // Clear old token
      window.location.href = '/dashboard'; // Force reload to dashboard
      return; // Stop execution
    }
    
    // First time or same user
    localStorage.setItem('lastUserId', user.id);
    setCurrentUserId(user.id);
    
    // Clear old data and fetch new
    setProjects([]);
    setLoading(true);
    fetchProjects();
    
  } else if (!user) {
    // User logged out
    setProjects([]);
    setCurrentUserId(null);
    localStorage.removeItem('lastUserId');
    localStorage.removeItem('token');
  }
}, [user?.id]);



  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll()
      setProjects(response.data)
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([]) // Clear on error
    } finally {
      setLoading(false)
    }
  }

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const handleCreateProject = async (projectData) => {
    try {
      await projectsAPI.create(projectData)
      await fetchProjects() // Refresh list
      setShowModal(false)
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  // Calculate stats from real data (around line 90-95)
const totalTasks = projects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0)

// Count completed projects (projects where ALL tasks are done)
const completedProjects = projects.filter(project => {
  const projectTasks = project.tasks || []
  if (projectTasks.length === 0) return false // No tasks = not completed
  return projectTasks.every(task => task.status === 'done') // All tasks done
}).length

const inProgressTasks = totalTasks - projects.reduce((sum, p) => 
  sum + (p.tasks?.filter(t => t.status === 'done').length || 0), 0
)

const totalMembers = projects.reduce((sum, p) => sum + (p.members?.length || 0), 0)


  if (loading) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div className="navbar-brand">
            <div className="logo">📋</div>
            <h2>SCHEDURA</h2>
          </div>
        </nav>
        <div className="dashboard-content">
          <h2>Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo">📋</div>
          <h2>SCHEDURA</h2>
        </div>
        <div className="navbar-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
            {isDark ? '☀️' : '🌙'}
          </button>
          <div className="navbar-user">
            <span className="user-greeting">
              <span className="greeting-text">Welcome back,</span>
              <strong>{user?.firstName || 'User'}!</strong>
            </span>
            <UserButton afterSignOutUrl="/login" />
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
  <div className="header-left">
    <h1>My Projects</h1>
    <p className="subtitle">Manage and track your projects in one place</p>
  </div>
  <div className="header-right">
    <button 
      className="btn-primary" 
      onClick={() => {
        setLoading(true)
        fetchProjects()
      }}
      title="Refresh projects"
    >
      🔄 Refresh
    </button>
    <button className="btn-primary" onClick={() => setShowModal(true)}>
      <span className="btn-icon">+</span>
      New Project
    </button>
  </div>
</div>


        <div className="stats-cards">
  <div className="stat-card">
    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #1976D2 0%, #2196F3 100%)' }}>
      📊
    </div>
    <div className="stat-info">
      <h3>{projects.length}</h3>
      <p>Total Projects</p>
    </div>
  </div>
  
  <div className="stat-card">
    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #42A5F5 0%, #64B5F6 100%)' }}>
      ✅
    </div>
    <div className="stat-info">
      <h3>{completedProjects}</h3>
      <p>Completed Projects</p>
    </div>
  </div>
  
  <div className="stat-card">
    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)' }}>
      🔄
    </div>
    <div className="stat-info">
      <h3>{inProgressTasks}</h3>
      <p>In Progress Tasks</p>
    </div>
  </div>
  
  <div className="stat-card">
    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)' }}>
      👥
    </div>
    <div className="stat-info">
      <h3>{totalMembers}</h3>
      <p>Team Members</p>
    </div>
  </div>
</div>


        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              No projects yet
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Create your first project to get started!
            </p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <span className="btn-icon">+</span>
              Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => {
              // Get tasks from the project's tasks array (populated by backend)
              const projectTasks = project.tasks || []
              const taskCount = projectTasks.length
              const completedCount = projectTasks.filter(t => t.status === 'done').length
              
              // Calculate weighted progress based on task positions in workflow
              const calculateProgress = (tasksList) => {
                if (tasksList.length === 0) return 0
                
                const statusWeights = {
                  'todo': 0,
                  'in-progress': 33,
                  'review': 66,
                  'done': 100
                }
                
                const totalProgress = tasksList.reduce((sum, task) => {
                  return sum + (statusWeights[task.status] || 0)
                }, 0)
                
                return Math.round(totalProgress / tasksList.length)
              }
              
              const progress = calculateProgress(projectTasks)

              return (
                <div key={project._id} className="project-card" style={{ borderTop: `4px solid ${project.color || '#1976D2'}` }}>
                  <div className="project-card-header">
                    <div className="project-header">
                      <div className="project-color" style={{ backgroundColor: project.color || '#1976D2' }}></div>
                      <h3>{project.title}</h3>
                    </div>
                    <button 
                      className="btn-delete-project"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
                          try {
                            await projectsAPI.delete(project._id);
                            await fetchProjects();
                          } catch (error) {
                            console.error('Error deleting project:', error);
                            alert('Failed to delete project. You may not have permission.');
                          }
                        }
                      }}
                      title="Delete project"
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="project-description">{project.description || 'No description provided'}</p>
                  
                  <div className="project-progress">
                    <div className="progress-info">
                      <span className="progress-label">Progress</span>
                      <span className="progress-percentage">{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: project.color || '#1976D2'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="project-footer">
                    <div className="project-stats">
                      <span className="stat-item">
                        <span className="stat-icon">✓</span>
                        {completedCount}/{taskCount} tasks
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">👥</span>
                        {project.members?.length || 1} members
                      </span>
                    </div>
                    <button className="btn-view" onClick={() => window.location.href = `/project/${project._id}`}>
                      View →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ProjectModal 
          onClose={() => setShowModal(false)} 
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  )
}

export default Dashboard
