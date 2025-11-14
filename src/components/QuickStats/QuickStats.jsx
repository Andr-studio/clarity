import React from 'react';
import { CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';
import PropTypes from 'prop-types';
import './QuickStats.css';

const QuickStats = ({ stats }) => {
  const statsConfig = [
    { key: 'tasksCompleted', label: 'Tareas Completadas', value: stats.tasksCompleted, icon: CheckCircle, color: 'green', trend: '+2' },
    { key: 'daysRemaining', label: 'Días Restantes', value: stats.daysRemaining, icon: Clock, color: 'orange', trend: null, total: 90 }, // Añadimos un total de referencia
    { key: 'weeklyProgress', label: 'Progreso Semanal', value: stats.weeklyProgress, icon: TrendingUp, color: 'blue', trend: '+12%' },
    { key: 'activeMembers', label: 'Miembros del Equipo', value: stats.activeMembers, icon: Users, color: 'purple', trend: '100%' }
  ];

  // --- 1. FUNCIÓN PARA CALCULAR EL PORCENTAJE ---
  // Esta función convierte los distintos valores de texto en un número de 0 a 100.
  const calculatePercentage = (stat) => {
    const { key, value, total } = stat;
    switch (key) {
      case 'tasksCompleted':
      case 'activeMembers': {
        const [completed, totalTasks] = String(value).split('/').map(Number);
        if (!totalTasks || totalTasks === 0) return 0;
        return (completed / totalTasks) * 100;
      }
      case 'weeklyProgress': {
        return parseFloat(String(value).replace('%', '')) || 0;
      }
      case 'daysRemaining': {
        const remaining = Number(value);
        if (!total || isNaN(remaining)) return 0;
        // Muestra el porcentaje del tiempo que queda
        return (remaining / total) * 100;
      }
      default:
        return 0;
    }
  };

  const getColorClass = (color) => `quick-stat--${color}`;

  // --- 2. CONSTANTES PARA EL CÁLCULO DEL ANILLO SVG ---
  const radius = 25;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="quick-stats">
      <h3 className="quick-stats__title">Estadísticas Rápidas</h3>
      <div className="quick-stats__list">
        {statsConfig.map((stat) => {
          const IconComponent = stat.icon;
          // --- 3. CÁLCULO DINÁMICO PARA CADA ESTADÍSTICA ---
          const percentage = calculatePercentage(stat);
          const strokeDashoffset = circumference - (percentage / 100) * circumference;

          return (
            <div key={stat.key} className={`quick-stat ${getColorClass(stat.color)}`}>
              <div className="quick-stat__content">
                <div className="quick-stat__icon-container">
                  <IconComponent className="quick-stat__icon" />
                </div>
                <div className="quick-stat__info">
                  <div className="quick-stat__header">
                    <span className="quick-stat__value">{stat.value}</span>
                    {stat.trend && <span className="quick-stat__trend">{stat.trend}</span>}
                  </div>
                  <span className="quick-stat__label">{stat.label}</span>
                </div>
              </div>
              <div className="quick-stat__progress-ring">
                <svg className="quick-stat__ring-svg" width="60" height="60">
                  <circle className="quick-stat__ring-bg" cx="30" cy="30" r={radius} />
                  <circle
                    className="quick-stat__ring-progress"
                    cx="30"
                    cy="30"
                    r={radius}
                    // --- 4. APLICACIÓN DEL ESTILO DINÁMICO ---
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset
                    }}
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

QuickStats.propTypes = {
  stats: PropTypes.shape({
    tasksCompleted: PropTypes.string,
    daysRemaining: PropTypes.string,
    weeklyProgress: PropTypes.string,
    activeMembers: PropTypes.string,
  }).isRequired,
};

export default QuickStats;