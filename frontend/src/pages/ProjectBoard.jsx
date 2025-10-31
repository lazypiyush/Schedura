import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../context/SocketContext'
import { projectsAPI, tasksAPI } from '../services/api'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import TeamModal from '../components/TeamModal'
import TaskDetailModal from '../components/TaskDetailModal'
import Column from '../components/Column'
import './ProjectBoard.css'


const ProjectBoard = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const socket = useSocket()
  useAuth()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showTeamList, setShowTeamList] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState(null)
  const [activeTask, setActiveTask] = useState(null)
  const [isDark, setIsDark] = useState(false)
  const [focusedTaskId, setFocusedTaskId] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)

  const columns = [
    { id: 'todo', title: 'To Do', color: '#9E9E9E' },
    { id: 'in-progress', title: 'In Progress', color: '#2196F3' },
    { id: 'review', title: 'Review', color: '#FF9800' },
    { id: 'done', title: 'Done', color: '#4CAF50' }
  ]

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  )

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setIsDark(savedTheme === 'dark')
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  useEffect(() => {
    fetchProjectData()
  }, [id])

  // ✅ SOCKET.IO - Join project and listen for comments
  useEffect(() => {
    if (socket && id) {
      socket.emit('join-project', id)
      console.log('✅ Joined project room:', id)

      socket.on('comment-added', (data) => {
        console.log('💬 New comment added:', data)
        fetchProjectData()
      })

      return () => {
        socket.off('comment-added')
      }
    }
  }, [socket, id])

  // ✅ REAL-TIME TASK UPDATES - Listen for teammate changes
  useEffect(() => {
    if (socket && id) {
      // Listen for task movements from other users
      socket.on('task-moved', (data) => {
        console.log('🔄 Task moved by teammate:', data)
        
        // Update UI without API call
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === data.taskId
              ? { ...task, status: data.toStatus }
              : task
          )
        )
      })

      // Listen for task updates
      socket.on('task-updated', (data) => {
        console.log('📋 Task updated by teammate:', data)
        
        // Refresh if important fields changed
        if (data.title || data.description || data.priority || data.dueDate) {
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task._id === data.taskId
                ? { ...task, ...data.updates }
                : task
            )
          )
        }
      })

      return () => {
        socket.off('task-moved')
        socket.off('task-updated')
      }
    }
  }, [socket, id])

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        projectsAPI.getById(id),
        tasksAPI.getByProject(id)
      ])
      setProject(projectRes.data)
      setTasks(tasksRes.data)
    } catch (error) {
      console.error('Error fetching project data:', error)
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

  const handleCreateTask = async (taskData) => {
    try {
      await tasksAPI.create({
        ...taskData,
        project: id,
        status: selectedColumn
      })
      await fetchProjectData()
      setShowTaskModal(false)
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleUpdateTask = async (taskData) => {
    try {
      await tasksAPI.update(editingTask._id, taskData)
      await fetchProjectData()

      // ✅ EMIT SOCKET EVENT - Notify all users
      if (socket) {
        socket.emit('task-updated', {
          taskId: editingTask._id,
          updates: taskData,
          projectId: id,
          userId: user?.id,
          userName: user?.firstName
        })
      }

      setEditingTask(null)
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    
    try {
      await tasksAPI.delete(taskId)
      await fetchProjectData()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
  }

  const handleCloseModal = () => {
    setSelectedTask(null)
  }

  const handleDragStart = (event) => {
    const task = tasks.find(t => t._id === event.active.id)
    setActiveTask(task)
  }

  // ✅ UPDATED - With Socket.IO emit for real-time sync
  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return
    const taskId = active.id
    const newStatus = over.id

    const validColumns = columns.map(col => col.id)
    if (!validColumns.includes(newStatus)) return

    const currentTask = tasks.find(t => t._id === taskId)
    if (!currentTask || currentTask.status === newStatus) return

    // ✅ Optimistic UI update
    setTasks(tasks.map(task =>
      task._id === taskId ? { ...task, status: newStatus } : task
    ))

    try {
      await tasksAPI.update(taskId, { status: newStatus })

      // ✅ EMIT SOCKET EVENT - Notify all users
      if (socket) {
        socket.emit('task-moved', {
          taskId: taskId,
          fromStatus: currentTask.status,
          toStatus: newStatus,
          projectId: id,
          userId: user?.id,
          userName: user?.firstName
        })
      }
    } catch (error) {
      console.error('Error updating task:', error)
      await fetchProjectData()
    }
  }

  const handleMoveTaskKeyboard = async (taskId, currentStatus, direction) => {
    const columnOrder = ['todo', 'in-progress', 'review', 'done']
    const currentIndex = columnOrder.indexOf(currentStatus)
    let newIndex
    if (direction === 'prev') {
      newIndex = Math.max(0, currentIndex - 1)
    } else {
      newIndex = Math.min(columnOrder.length - 1, currentIndex + 1)
    }
    const newStatus = columnOrder[newIndex]
    if (newStatus === currentStatus) return

    setTasks(tasks.map(task =>
      task._id === taskId ? { ...task, status: newStatus } : task
    ))
    setFocusedTaskId(taskId)

    try {
      await tasksAPI.update(taskId, { status: newStatus })

      // ✅ EMIT SOCKET EVENT for keyboard navigation too
      if (socket) {
        socket.emit('task-moved', {
          taskId: taskId,
          fromStatus: currentStatus,
          toStatus: newStatus,
          projectId: id,
          userId: user?.id,
          userName: user?.firstName
        })
      }
    } catch (error) {
      console.error('Error updating task:', error)
      await fetchProjectData()
    }
  }

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status)
  }

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

  const workflowProgress = calculateProgress(tasks)

  if (loading) return <div className="loading">Loading project...</div>
  if (!project) return <div className="loading">Project not found</div>

  return (
    <div className="project-board">
      <nav className="navbar">
        <div className="navbar-brand">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <div className="project-title">
            <div className="project-color-dot" style={{ backgroundColor: project.color }}></div>
            <h2>{project.title}</h2>
          </div>
        </div>
        <div className="navbar-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
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

      <div className="board-content">
        <div className="board-header">
          <div className="board-header-left">
            <h1>{project.title}</h1>
            <p>{project.description}</p>

            {/* Team Members Display */}
            <div className="team-members-display">
              <div 
                className="members-preview" 
                onClick={() => setShowTeamList(!showTeamList)}
              >
                <div className="members-avatars">
                  {project.members?.slice(0, 5).map((member, index) => (
                    <div 
                      key={member._id} 
                      className="member-avatar-item"
                      style={{ zIndex: project.members.length - index }}
                    >
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {project.createdBy._id === member._id && (
                        <div className="admin-badge">👑</div>
                      )}
                    </div>
                  ))}
                  {project.members?.length > 5 && (
                    <div className="member-avatar-item more-members">
                      +{project.members.length - 5}
                    </div>
                  )}
                </div>
                <span className="team-count">
                  {project.members?.length || 0} members • Click to view
                </span>
              </div>

              {/* Team List Popup */}
              {showTeamList && (
                <div className="team-list-popup">
                  <div className="team-list-header">
                    <h3>Team Members</h3>
                    <button onClick={() => setShowTeamList(false)}>✕</button>
                  </div>
                  <div className="team-list-items">
                    {project.members?.map((member) => (
                      <div key={member._id} className="team-member-row">
                        <div className="member-avatar-small">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} />
                          ) : (
                            <div className="avatar-placeholder-small">
                              {member.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="member-details">
                          <div className="member-name-row">
                            <span className="member-name">{member.name}</span>
                            {project.createdBy._id === member._id && (
                              <span className="admin-label">👑 Admin</span>
                            )}
                          </div>
                          <span className="member-email">{member.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="board-actions">
            <div className="board-stats">
              <span className="stat">{tasks.length} tasks</span>
              <span className="stat">{tasks.filter(t => t.status === 'done').length} completed</span>
              <span className="stat">{workflowProgress}% workflow</span>
            </div>
            <button className="btn-team" onClick={() => setShowTeamModal(true)}>
              👥 Manage Team
            </button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="board-columns">
            {columns.map(column => (
              <Column
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
                onAddTask={() => {
                  setSelectedColumn(column.id)
                  setShowTaskModal(true)
                }}
                onEditTask={(task) => setEditingTask(task)}
                onDeleteTask={handleDeleteTask}
                onMoveTask={handleMoveTaskKeyboard}
                focusedTaskId={focusedTaskId}
                setFocusedTaskId={setFocusedTaskId}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showTaskModal && (
        <TaskModal
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdateTask}
        />
      )}

      {showTeamModal && (
        <TeamModal
          project={project}
          onClose={() => setShowTeamModal(false)}
          onUpdate={(updatedProject) => {
            setProject(updatedProject)
            setShowTeamModal(false)
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={id}
          onClose={handleCloseModal}
          onUpdate={fetchProjectData}
        />
      )}
    </div>
  )
}

export default ProjectBoard
