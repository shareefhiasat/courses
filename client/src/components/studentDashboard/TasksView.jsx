import React from 'react';
import { Card, CardBody, Select, Tabs, EmptyState } from '../ui';
import { Inbox } from 'lucide-react';
import TaskCard from './TaskCard';
import styles from '../../pages/StudentDashboardPage_NEW.module.css';

export default function TasksView({ 
  filteredTasks, 
  classes, 
  selectedClass, 
  setSelectedClass, 
  taskFilter, 
  setTaskFilter, 
  statusFilter, 
  setStatusFilter, 
  navigate 
}) {
  return (
    <div className={styles.tasksView}>
      <Card>
        <CardBody>
          <div className={styles.tasksHeader}>
            <h2>My Tasks</h2>
            <div className={styles.tasksFilters}>
              <Select 
                searchable
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={[
                  { value: 'all', label: 'All Classes' },
                  ...classes.map(cls => ({
                    value: cls.id,
                    label: cls.name
                  }))
                ]}
                placeholder="Select Class"
                size="sm"
              />

              <Tabs
                value={taskFilter}
                onChange={setTaskFilter}
                tabs={[
                  { value: 'all', label: 'All' },
                  { value: 'quiz', label: 'Quizzes' },
                  { value: 'homework', label: 'Homework' },
                  { value: 'resource', label: 'Resources' }
                ]}
                size="sm"
              />

              <Tabs
                value={statusFilter}
                onChange={setStatusFilter}
                tabs={[
                  { value: 'all', label: 'All' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'overdue', label: 'Overdue' }
                ]}
                size="sm"
              />
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No tasks found"
              description="You're all caught up! Check back later for new assignments."
            />
          ) : (
            <div className={styles.tasksList}>
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} navigate={navigate} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}




