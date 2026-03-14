import cron from 'node-cron';
import prisma from '../lib/prisma.js'; // Note: adjust path if necessary for your build system
import { runRecommendationEngine } from '../services/taxRecommendationService.js';

/**
 * Monthly Tax Analysis Job
 * Schedule: 9 AM on the 1st of every month
 */
export function initTaxJobs() {
  console.log('[TaxJob] Initializing recurring tax analysis cron...');
  
  cron.schedule('0 9 1 * *', async () => {
    console.log('[TaxJob] Starting monthly automated tax analysis...');
    
    try {
      const activeBusinesses = await prisma.business.findMany({
        select: { id: true }
      });

      console.log(`[TaxJob] Found ${activeBusinesses.length} active businesses to process.`);

      for (const business of activeBusinesses) {
        try {
          const result = await runRecommendationEngine(business.id);
          console.log(`[TaxJob] Successfully ran for ${business.id}: ${result.count} recommendations found.`);
          
          // 2 second sleep to respect API rate limits (e.g. Grok/xAI)
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
          console.error(`[TaxJob] Failed to process business ${business.id}:`, err);
        }
      }
      console.log('[TaxJob] Monthly automated analysis completed.');
    } catch (err) {
      console.error('[TaxJob] CRITICAL ERROR: Cron job master look failed:', err);
    }
  });
}
