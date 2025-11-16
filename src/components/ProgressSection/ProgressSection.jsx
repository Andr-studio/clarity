import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import PropTypes from 'prop-types';
import { FileText, BarChart3 } from 'lucide-react';
import './ProgressSection.css';
import './CommentSystem.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Importar los componentes de vista
import DetailedView from './views/DetailedView';
import KanbanView from './views/KanbanView';
import CalendarView from './views/CalendarView';
import CommentModal from './CommentModal';
import CardsView from './views/CardsView';
import ProgressBarView from './views/ProgressBarView';
import TableView from './views/TableView';
import API from '../../services/api';

const ProgressSection = ({ progress, milestones, projectName, projectId, userId, multimediaPorHito = {} }) => {
  const [selectedView, setSelectedView] = useState('detailed');
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    milestoneId: null,
    milestoneTitle: ''
  });
  const [milestonesWithComments, setMilestonesWithComments] = useState(milestones);

  // Validar props
  if (!milestones || !Array.isArray(milestones)) {
    console.error('ProgressSection: milestones debe ser un array', milestones);
    return (
      <div className="progress-section">
        <div className="progress-section__error">
          <p>Error: No se pudieron cargar los hitos del proyecto</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    console.error('ProgressSection: userId es requerido', userId);
  }

  if (!projectId) {
    console.error('ProgressSection: projectId es requerido', projectId);
  }

  // Actualizar milestones cuando cambian las props
  useEffect(() => {
    setMilestonesWithComments(milestones);
  }, [milestones]);
  
  // Configuración de vistas disponibles
  const viewConfig = {
    detailed: { label: 'Lista Detallada', component: DetailedView },
    kanban: { label: 'Kanban', component: KanbanView },
    calendar: { label: 'Vista Calendario', component: CalendarView },
    cards: { label: 'Vista de Tarjetas', component: CardsView },
    progressBar: { label: 'Barra de Progreso', component: ProgressBarView },
    table: { label: 'Tabla', component: TableView }
  };

  const handleOpenComments = (milestoneId) => {
    const milestone = milestonesWithComments.find(m => m.id === milestoneId);
    if (milestone) {
      setCommentModal({
        isOpen: true,
        milestoneId: milestoneId,
        milestoneTitle: milestone.title
      });
    }
  };

  const handleCloseComments = () => {
    setCommentModal({
      isOpen: false,
      milestoneId: null,
      milestoneTitle: ''
    });
  };

  const handleCommentAdded = async () => {
    // Recargar el contador de comentarios del milestone específico
    if (commentModal.milestoneId && projectId) {
      try {
        const comments = await API.comentarios.getByHito(projectId, commentModal.milestoneId);
        
        // Actualizar el milestone con el nuevo contador
        setMilestonesWithComments(prevMilestones => 
          prevMilestones.map(m => 
            m.id === commentModal.milestoneId 
              ? { ...m, commentCount: comments.length }
              : m
          )
        );
      } catch (error) {
        console.error('Error actualizando contador de comentarios:', error);
      }
    }
  };

  const getCommentCount = (milestoneId) => {
    const milestone = milestonesWithComments.find(m => m.id === milestoneId);
    return milestone?.commentCount || 0;
  };

  const handleDownloadCSV = () => {
    const dataForCSV = milestonesWithComments.map(m => ({
      'Hito': m.title,
      'Responsable': m.assignee,
      'Fecha Límite': m.dueDate,
      'Estado': {
        'completado': 'Completado',
        'en-progreso': 'En Progreso',
        'pendiente': 'Pendiente'
      }[m.status],
      'Progreso (%)': m.progress
    }));

    const csv = Papa.unparse(dataForCSV);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte-hitos-${projectName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Reporte de Progreso: ${projectName}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Progreso General del Proyecto: ${progress}% Completado`, 14, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 36);

    const tableColumn = ['Hito', 'Responsable', 'Fecha Límite', 'Estado', 'Progreso (%)'];
    const tableRows = [];

    milestonesWithComments.forEach(milestone => {
      const milestoneData = [
        milestone.title,
        milestone.assignee,
        milestone.dueDate,
        {
          'completado': 'Completado',
          'en-progreso': 'En Progreso',
          'pendiente': 'Pendiente'
        }[milestone.status],
        `${milestone.progress}%`
      ];
      tableRows.push(milestoneData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 44,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 82, 204] }
    });

    doc.save(`reporte-progreso-${projectName}.pdf`);
  };

  // Renderizar la vista seleccionada
  const renderSelectedView = () => {
    const ViewComponent = viewConfig[selectedView]?.component;
    if (!ViewComponent) return null;

    return <ViewComponent
      milestones={milestonesWithComments}
      onOpenComments={handleOpenComments}
      getCommentCount={getCommentCount}
      multimediaPorHito={multimediaPorHito}
    />;
  };

  return (
    <div className="progress-section">
      <div className="progress-section__header">
        <h3 className="progress-section__title">Progreso General de Hitos</h3>
        <div className="progress-section__controls">
          <div className="progress-control">
            <label htmlFor="view-select" className="progress-control__label">Vista:</label>
            <select
              id="view-select"
              className="progress-control__select"
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
            >
              {Object.entries(viewConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="progress-section__actions">
            <button className="progress-btn progress-btn--secondary" onClick={handleDownloadPDF}>
              <FileText className="progress-btn__icon" />
              <span>PDF</span>
            </button>
            <button className="progress-btn progress-btn--secondary" onClick={handleDownloadCSV}>
              <BarChart3 className="progress-btn__icon" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overall-progress">
        <div className="overall-progress__header">
          <span className="overall-progress__label">Progreso Total</span>
          <span className="overall-progress__value">{progress}% Completado</span>
        </div>
        <div className="overall-progress__bar">
          <div 
            className="overall-progress__fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="milestones">
        <h4 className="milestones__title">Hitos Clave</h4>
        {renderSelectedView()}
      </div>

      <CommentModal
        isOpen={commentModal.isOpen}
        onClose={handleCloseComments}
        milestoneId={commentModal.milestoneId}
        projectId={projectId}
        milestoneTitle={commentModal.milestoneTitle}
        userId={userId}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};

ProgressSection.propTypes = {
  progress: PropTypes.number.isRequired,
  milestones: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    progress: PropTypes.number,
    status: PropTypes.string,
    dueDate: PropTypes.string,
    assignee: PropTypes.string,
    commentCount: PropTypes.number,
  })).isRequired,
  projectName: PropTypes.string,
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  multimediaPorHito: PropTypes.object,
};

ProgressSection.defaultProps = {
  projectName: 'Proyecto',
};

export default ProgressSection;