import { useState } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  assembleReportSections,
  formatReportDate,
  formatReportTime,
  getTimelineEventStyle,
} from '../../services/reportTemplateService';
import ReportToolbar from './ReportToolbar';

/**
 * Professional full-page mission report preview.
 * Renders the report on-screen in a premium document layout.
 */
export default function MissionReportPreview({ open, onClose, report }) {
  if (!report) return null;

  const rd = report.report_data;
  const sections = assembleReportSections(rd);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: '#F1F5F9',
        },
      }}
    >
      {/* Toolbar */}
      <ReportToolbar report={report} onClose={onClose} />

      {/* Document Container */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          py: 4,
          px: 2,
        }}
      >
        {/* A4 Landscape Document */}
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            maxWidth: 1100,
            minHeight: 760,
            bgcolor: '#FFFFFF',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          {/* ─── Document Header ─────────────────────────────────────── */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              px: 5,
              py: 4,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Watermark */}
            <Typography
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '6rem',
                fontWeight: 900,
                color: 'rgba(255,255,255,0.02)',
                letterSpacing: '-0.04em',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              FLYBY
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              {/* Left — Branding */}
              <Box>
                <Box component="img" src="/flyby-icon-192.png" alt="FlyBy" sx={{ width: 48, height: 48, borderRadius: '10px' }} />
                <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', mt: 2 }}>
                  MISSION REPORT
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8', mt: 0.25 }}>
                  Professional Agricultural Drone Operations
                </Typography>
              </Box>

              {/* Right — Report meta */}
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#16A34A' }}>
                  {rd?.generated?.report_number}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.5 }}>
                  {formatReportDate(rd?.generated?.generated_at)}
                </Typography>
                {rd?.mission?.mission_number && (
                  <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', mt: 1.5 }}>
                    {rd.mission.mission_number}
                  </Typography>
                )}
                {rd?.mission?.status && (
                  <Chip
                    label={rd.mission.status.toUpperCase()}
                    size="small"
                    sx={{
                      mt: 1,
                      height: 22,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(22,163,74,0.15)',
                      color: '#22C55E',
                      letterSpacing: '0.04em',
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* ─── Document Body ───────────────────────────────────────── */}
          <Box sx={{ px: 5, py: 4 }}>
            {sections.map((section) => (
              <Box key={section.key} sx={{ mb: 4 }}>
                {/* Section Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ width: 3, height: 20, borderRadius: '2px', bgcolor: '#16A34A' }} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {section.title}
                  </Typography>
                </Box>

                {/* Grid sections */}
                {section.type === 'grid' && (
                  <>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${section.columns || 4}, 1fr)`,
                        gap: 2.5,
                        mb: section.notes?.length || section.placeholders?.length ? 2 : 0,
                      }}
                    >
                      {section.items.map((item, idx) => (
                        <Box key={idx}>
                          <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.3 }}>
                            {item.label}
                          </Typography>
                          {item.badge ? (
                            <Chip
                              label={item.value || '—'}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                bgcolor: 'rgba(22,163,74,0.08)',
                                color: '#16A34A',
                              }}
                            />
                          ) : item.highlight ? (
                            <Typography
                              sx={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: item.highlight === 'error' ? '#EF4444' :
                                       item.highlight === 'warning' ? '#D97706' : '#16A34A',
                              }}
                            >
                              {item.value || '—'}
                            </Typography>
                          ) : (
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>
                              {item.value || '—'}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>

                    {/* Notes */}
                    {section.notes?.map((note, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          mt: 1.5,
                          p: 2,
                          borderRadius: '10px',
                          bgcolor: '#F8FAFC',
                          border: '1px solid rgba(15,23,42,0.04)',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
                          {note.label}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5 }}>
                          {note.text}
                        </Typography>
                      </Box>
                    ))}

                    {/* Placeholders */}
                    {section.placeholders?.length > 0 && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          borderRadius: '10px',
                          bgcolor: '#F8FAFC',
                          border: '1px dashed rgba(15,23,42,0.08)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                          {section.placeholders.join(' • ')} — Available in future release
                        </Typography>
                      </Box>
                    )}
                  </>
                )}

                {/* Timeline sections */}
                {section.type === 'timeline' && (
                  <Box sx={{ pl: 1 }}>
                    {section.events.map((event, idx) => {
                      const style = getTimelineEventStyle(event.event_type);
                      return (
                        <Box key={idx} sx={{ display: 'flex', gap: 2, pb: 2, position: 'relative' }}>
                          {/* Connector line */}
                          {idx < section.events.length - 1 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 5.5,
                                top: 15,
                                width: 1.5,
                                height: 'calc(100% - 8px)',
                                bgcolor: 'rgba(15,23,42,0.06)',
                                borderRadius: '1px',
                              }}
                            />
                          )}

                          {/* Dot */}
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: style.color,
                              flexShrink: 0,
                              mt: 0.3,
                              position: 'relative',
                              zIndex: 1,
                              border: '2px solid #FFFFFF',
                              boxShadow: '0 0 0 2px rgba(15,23,42,0.04)',
                            }}
                          />

                          {/* Content */}
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                                {event.event_label || style.label}
                              </Typography>
                              <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                                {formatReportTime(event.created_at)} • {event.user_name || 'System'}
                              </Typography>
                            </Box>
                            {event.notes && (
                              <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 0.25 }}>
                                {event.notes}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                {/* Section divider */}
                <Divider sx={{ mt: 3, borderColor: 'rgba(15,23,42,0.04)' }} />
              </Box>
            ))}

            {/* ─── Certification Block ─────────────────────────────────── */}
            <Box
              sx={{
                mt: 2,
                p: 3,
                borderRadius: '12px',
                border: '2px solid #16A34A',
                bgcolor: 'rgba(22,163,74,0.02)',
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 1.5 }}>
                Mission Certification
              </Typography>

              {rd?.mission?.status === 'Completed' && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                  <CheckCircleIcon sx={{ fontSize: '1.1rem', color: '#16A34A' }} />
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#16A34A' }}>
                    COMPLETED SUCCESSFULLY
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2, borderColor: 'rgba(15,23,42,0.06)' }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Generated by
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', mt: 0.25 }}>
                    FlyBy by Feldrix
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                    Smart Drone Operations
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Generation Date
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', mt: 0.25 }}>
                    {formatReportDate(rd?.generated?.generated_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Generation Time
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', mt: 0.25 }}>
                    {formatReportTime(rd?.generated?.generated_at)}
                  </Typography>
                </Box>
              </Box>

              <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', mt: 2 }}>
                This report was automatically generated by the FlyBy Operations Platform.
              </Typography>
            </Box>
          </Box>

          {/* ─── Document Footer ─────────────────────────────────────── */}
          <Box
            sx={{
              px: 5,
              py: 2,
              borderTop: '1px solid rgba(15,23,42,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B' }}>
                FlyBy by Feldrix
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8' }}>
                Smart Drone Operations • www.feldrix.com
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8' }}>
                Report v{rd?.generated?.version || '1.0'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                {formatReportDate(rd?.generated?.generated_at)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Dialog>
  );
}
