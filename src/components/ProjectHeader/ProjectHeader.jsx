import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Calendar, DollarSign, Users, Code, Zap, ChevronDown, Loader, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import './ProjectHeader.css';
import firebaseProjectsAPI from '../../services/firebaseProjects';
import geminiService from '../../services/geminiService';
import {authAPI} from '../../services/firebaseAuth';

// Funciones helper para limpiar y parsear el contenido
const cleanMarkdown = (text) => {
  if (!text) return null;
  
  // Remover ** bold markdown
  let cleaned = text.replace(/\*\*/g, '');
  
  // Dividir en párrafos
  const paragraphs = cleaned.split('\n\n').filter(p => p.trim());
  
  return (
    <div className="parsed-content">
      {paragraphs.map((para, idx) => {
        // Si es una lista
        if (para.includes('*') || para.includes('•')) {
          const items = para.split('\n').filter(item => item.trim());
          return (
            <ul key={idx} className="content-list">
              {items.map((item, i) => (
                <li key={i}>{item.replace(/^[\*\•\-]\s*/, '').trim()}</li>
              ))}
            </ul>
          );
        }
        // Si es un párrafo normal
        return <p key={idx} className="content-paragraph">{para.trim()}</p>;
      })}
    </div>
  );
};

const parseStats = (text) => {
  if (!text) return null;
  
  const cleaned = text.replace(/\*\*/g, '');
  const lines = cleaned.split('\n').filter(l => l.trim());
  
  return (
    <div className="stats-grid">
      {lines.slice(0, 4).map((line, idx) => {
        const match = line.match(/^[•\*\-]?\s*(.+?):\s*(.+)$/);
        if (match) {
          return (
            <div key={idx} className="stat-item">
              <span className="stat-label">{match[1].trim()}</span>
              <span className="stat-value">{match[2].trim()}</span>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

const parseRecommendations = (text) => {
  if (!text) return null;
  
  // Si el texto ya está formateado con separadores
  if (text.includes('---')) {
    const recs = text.split('---').filter(r => r.trim());
    return (
      <div className="recommendations-list">
        {recs.map((rec, idx) => (
          <div key={idx} className="recommendation-item">
            <span className="recommendation-number">{idx + 1}</span>
            <div className="recommendation-text" style={{ whiteSpace: 'pre-line' }}>
              {rec.trim()}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Fallback: método anterior
  const cleaned = text.replace(/\*\*/g, '').trim();
  const parts = cleaned.split(/(?=\*?\s*¿Qué debe hacer\?)/i).filter(p => p.trim());
  
  const recommendations = parts.map(part => {
    return part
      .split('\n')
      .map(line => line.replace(/^\*\s*/, '').trim())
      .filter(line => line.length > 0)
      .join('\n');
  });
  
  if (recommendations.length === 0) return null;
  
  return (
    <div className="recommendations-list">
      {recommendations.map((item, idx) => (
        <div key={idx} className="recommendation-item">
          <span className="recommendation-number">{idx + 1}</span>
          <div className="recommendation-text" style={{ whiteSpace: 'pre-line' }}>
            {item}
          </div>
        </div>
      ))}
    </div>
  );
};

const parseRisks = (text) => {
  if (!text) return null;
  
  // Si el texto ya está formateado con separadores
  if (text.includes('---')) {
    const risks = text.split('---').filter(r => r.trim());
    return (
      <div className="risks-list">
        {risks.map((risk, idx) => {
          // Limpiar ** del markdown
          const cleanedRisk = risk.trim().replace(/\*\*/g, '');
          return (
            <div key={idx} className="risk-item">
              <span className="risk-bullet">•</span>
              <div className="risk-text" style={{ whiteSpace: 'pre-line' }}>
                {cleanedRisk}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  
  // Fallback: método anterior
  let cleaned = text.replace(/\*\*/g, '').replace(/\|/g, '').trim();
  const parts = cleaned.split(/(?=\*?\s*¿[^?]+\?)/i).filter(p => p.trim());
  
  const risks = parts.map(part => {
    return part
      .split('\n')
      .map(line => line.replace(/^\*\s*/, '').trim())
      .filter(line => line.length > 0 && !line.includes('---') && !line.toLowerCase().includes('| riesgo'))
      .join(' ');
  }).filter(risk => risk.length > 0);
  
  if (risks.length === 0) return null;
  
  return (
    <div className="risks-list">
      {risks.map((risk, idx) => (
        <div key={idx} className="risk-item">
          <span className="risk-bullet">•</span>
          <p className="risk-text">{risk}</p>
        </div>
      ))}
    </div>
  );
};

const ProjectHeader = ({ projectNames, currentProject, onProjectSelect, userId, user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Estados para manejar la lógica de la IA
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Función para manejar la selección de proyecto
  const handleSelect = (projectName) => {
    onProjectSelect(projectName);
    setIsDropdownOpen(false);
  };

  // Lógica mejorada para llamar a Gemini AI
  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError('');
    setSummary(null);

    try {
      // Obtener usuario autenticado
          
      if (!authAPI.isAuthenticated()) {
        throw new Error('Usuario no autenticado');
      }

      console.log('🔍 Analizando proyecto actual:', currentProject.name);
      
      // Llamar a Gemini AI para analizar el proyecto actual específico
      const result = await geminiService.analyzeProject(currentProject, {
        includeRecommendations: true,
        includeRisks: true
      });

      if (result.success) {
        setSummary(result.data.summary);
        console.log('✅ Análisis generado exitosamente');
      } else {
        throw new Error(result.error || 'Error al generar el análisis');
      }

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'No se pudo generar el análisis. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  console.log('📊 Current Project:', currentProject);
  console.log('👥 Team data:', currentProject.team);
  console.log('🔢 Team count:', currentProject.teamCount);

  return (
    <div className="project-header">
      <div className="project-header__content">
        <div className="project-header__main">
          <div className="project-header__info">
            <h2 className="project-header__title">
              Tu Proyecto:
              {/* Contenedor para posicionar el dropdown correctamente */}
              <div className="project-selector-container">
                <button 
                  className="project-selector" 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="project-selector__name">{currentProject.name}</span>
                  <ChevronDown className="project-selector__icon" />
                </button>

                {/* Renderizado condicional del dropdown */}
                {isDropdownOpen && (
                  <ul className="project-dropdown">
                    {projectNames.map((name) => (
                      <li
                        key={name}
                        className="dropdown-item"
                        onClick={() => handleSelect(name)}
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </h2>
            <p className="project-header__description">{currentProject.description}</p>
          </div>
          
          <button 
            className="project-header__ai-btn" 
            onClick={handleGenerateSummary}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="project-header__ai-icon project-header__ai-icon--loading" />
            ) : (
              <Zap className="project-header__ai-icon" />
            )}
            <span>{isLoading ? 'Analizando proyecto...' : 'Analizar con IA'}</span>
          </button>
        </div>

        {/* Mostrar resumen generado por IA */}
        {summary && (
          <div className="ai-summary-container">
            <div className="ai-summary-header">
              <CheckCircle className="ai-summary-icon" />
              <h3>Análisis IA del Proyecto</h3>
            </div>

            {/* Grid de 2 columnas */}
            <div className="ai-summary-grid">
              {/* Resumen General - Ocupa todo el ancho */}
              {summary.resumen && (
                <div className="ai-summary-card ai-summary-card--full">
                  <div className="card-header">
                    <TrendingUp size={20} />
                    <h4>Resumen Ejecutivo</h4>
                  </div>
                  <div className="card-content">
                    {cleanMarkdown(summary.resumen)}
                  </div>
                </div>
              )}

              {/* Estadísticas Clave */}
              {summary.estadisticas && (
                <div className="ai-summary-card ai-summary-card--stats">
                  <div className="card-header card-header--stats">
                    <span className="card-icon">📊</span>
                    <h4>Estadísticas</h4>
                  </div>
                  <div className="card-content card-content--compact">
                    {parseStats(summary.estadisticas)}
                  </div>
                </div>
              )}

              {/* Progreso */}
              {summary.progreso && (
                <div className="ai-summary-card ai-summary-card--progress">
                  <div className="card-header card-header--progress">
                    <span className="card-icon">📈</span>
                    <h4>Progreso</h4>
                  </div>
                  <div className="card-content card-content--compact">
                    {cleanMarkdown(summary.progreso)}
                  </div>
                </div>
              )}

              {/* Análisis de Recursos */}
              {summary.recursos && (
                <div className="ai-summary-card">
                  <div className="card-header card-header--resources">
                    <span className="card-icon">💰</span>
                    <h4>Recursos</h4>
                  </div>
                  <div className="card-content">
                    {cleanMarkdown(summary.recursos)}
                  </div>
                </div>
              )}

              {/* Recomendaciones */}
              {summary.recomendaciones && (
                <div className="ai-summary-card">
                  <div className="card-header card-header--recommendations">
                    <span className="card-icon">💡</span>
                    <h4>Recomendaciones</h4>
                  </div>
                  <div className="card-content">
                    {parseRecommendations(summary.recomendaciones)}
                  </div>
                </div>
              )}

              {/* Riesgos */}
              {summary.riesgos && (
                <div className="ai-summary-card ai-summary-card--warning">
                  <div className="card-header card-header--warning">
                    <span className="card-icon">⚠️</span>
                    <h4>Riesgos</h4>
                  </div>
                  <div className="card-content">
                    {parseRisks(summary.riesgos)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mostrar error si existe */}
        {error && (
          <div className="ai-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* El resto de la UI ahora usa los datos de 'currentProject' */}
        <div className="project-header__stats">
          <div className="project-stat project-stat--blue">
            <div className="project-stat__header">
              <Calendar className="project-stat__icon" />
              <span className="project-stat__label">Estado Actual</span>
            </div>
            <p className="project-stat__value">{currentProject.status}</p>
          </div>
          
          <div className="project-stat project-stat--green">
            <div className="project-stat__header">
              <DollarSign className="project-stat__icon" />
              <span className="project-stat__label">Presupuesto</span>
            </div>
            <p className="project-stat__value">{currentProject.budget}</p>
          </div>
          
          <div className="project-stat project-stat--purple">
            <div className="project-stat__header">
              <Users className="project-stat__icon" />
              <span className="project-stat__label">Equipo Asignado</span>
            </div>
            <p className="project-stat__value">
              {currentProject.team.length > 0 
                ? currentProject.team.join(', ') 
                : 'Sin miembros'}
            </p>
          </div>
          
          <div className="project-stat project-stat--orange">
            <div className="project-stat__header">
              <Code className="project-stat__icon" />
              <span className="project-stat__label">Tecnologías</span>
            </div>
            <p className="project-stat__value">{currentProject.technologies.join(", ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

ProjectHeader.propTypes = {
  projectNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentProject: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    budget: PropTypes.string,
    team: PropTypes.arrayOf(PropTypes.string),
    technologies: PropTypes.arrayOf(PropTypes.string),
    teamCount: PropTypes.number,
  }).isRequired,
  onProjectSelect: PropTypes.func.isRequired,
  user: PropTypes.shape({
    id: PropTypes.string,
    rol: PropTypes.string,
  }),
  userId: PropTypes.shape({
    id: PropTypes.string,
    rol: PropTypes.string,
  }),
};

ProjectHeader.defaultProps = {
  projectNames: [],
  onProjectSelect: () => {},
  user: null,
  userId: null,
};

export default ProjectHeader;