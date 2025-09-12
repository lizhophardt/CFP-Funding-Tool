import { Router } from 'express';
import { SecurityMetrics } from '../utils/securityMetrics';
import { ThreatResponse } from '../utils/threatResponse';
import { validateQueryParams } from '../middleware/validation';

const router = Router();
const securityMetrics = SecurityMetrics.getInstance();
const threatResponse = ThreatResponse.getInstance();

/**
 * Security Dashboard Routes
 * Provides real-time security monitoring and metrics
 */

// GET /api/security/dashboard - Get security dashboard data
router.get('/dashboard', validateQueryParams, (req, res) => {
  try {
    const dashboardData = securityMetrics.getDashboardData();
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/security/stats - Get basic security statistics
router.get('/stats', validateQueryParams, (req, res) => {
  try {
    const stats = securityMetrics.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/security/threats - Get threat response statistics
router.get('/threats', validateQueryParams, (req, res) => {
  try {
    const threatStats = threatResponse.getThreatStats();
    const blockedIPs = threatResponse.getBlockedIPs();
    
    res.json({
      success: true,
      data: {
        stats: threatStats,
        blockedIPs: blockedIPs.slice(0, 50), // Limit to 50 most recent
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve threat data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/security/export - Export security metrics (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/export', validateQueryParams, (req, res) => {
    try {
      const exportData = securityMetrics.exportMetrics();
      const threatData = {
        stats: threatResponse.getThreatStats(),
        blockedIPs: threatResponse.getBlockedIPs()
      };
      
      res.json({
        success: true,
        data: {
          security: exportData,
          threats: threatData
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to export security data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export default router;
