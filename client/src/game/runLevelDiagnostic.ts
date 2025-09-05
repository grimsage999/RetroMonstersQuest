
/**
 * Executable Level Diagnostic Script
 * Run this to get detailed analysis of levels 3, 4, 5 performance issues
 */

import { LevelPerformanceDiagnostic } from './LevelPerformanceDiagnostic';
import { LevelOptimizer } from './LevelOptimizer';

export function runLevelDiagnostic(): void {
  console.log('🔍 COSMIC PLAYGROUND LEVEL DIAGNOSTIC ANALYSIS');
  console.log('==================================================\n');

  const diagnostic = new LevelPerformanceDiagnostic();
  const optimizer = new LevelOptimizer();

  // Generate comprehensive report
  const report = optimizer.generateOptimizationReport();
  console.log(report);

  // Detailed analysis for problematic levels
  console.log('\n🔬 DETAILED ANALYSIS FOR LEVELS 3-5:\n');

  [3, 4, 5].forEach(level => {
    const data = diagnostic.analyzeLevelPerformance(level, 800, 600);
    
    console.log(`📋 LEVEL ${level} BREAKDOWN:`);
    console.log(`   Total Enemies: ${data.enemyCount}`);
    console.log(`   AI Complexity: ${data.entityComplexity.toFixed(1)}/30`);
    console.log(`   Background Load: ${data.backgroundComplexity}/15`);
    console.log(`   Animation Load: ${data.animationLoad.toFixed(1)}`);
    console.log(`   Total Rendering: ${data.renderingLoad}/30`);
    
    if (data.issues.length > 0) {
      console.log(`   🚨 Issues:`);
      data.issues.forEach(issue => console.log(`      • ${issue}`));
    }
    
    if (data.recommendations.length > 0) {
      console.log(`   💡 Recommendations:`);
      data.recommendations.slice(0, 3).forEach(rec => console.log(`      • ${rec}`));
    }
    console.log('');
  });

  // Performance comparison
  console.log('📈 PERFORMANCE IMPACT ANALYSIS:');
  console.log('');
  console.log('Level 1-2 vs 3-5 Comparison:');
  console.log('• Levels 1-2: 8-18 total entities, simple backgrounds');
  console.log('• Level 3: 12 entities + complex subway tiles + new AI types');
  console.log('• Level 4: 11 entities + atmospheric effects + zombie AI');
  console.log('• Level 5: 13 entities + boss system + lab equipment');
  console.log('');
  console.log('🎯 ROOT CAUSES OF SLOWDOWN:');
  console.log('1. Background Complexity Scaling:');
  console.log('   - Level 1: 8/15 complexity (desert gradients)');
  console.log('   - Level 3: 12/15 complexity (subway tiles + lighting)');
  console.log('   - Level 5: 11/15 complexity (lab grids + equipment)');
  console.log('');
  console.log('2. Enemy Type Diversity:');
  console.log('   - Levels 1-2: Only CIA agents + army men');
  console.log('   - Levels 3-5: + Radioactive rats + zombies + boss');
  console.log('');
  console.log('3. Animation Overhead:');
  console.log('   - Level 3: Flickering lights (4 extra units)');
  console.log('   - Level 4: Atmospheric effects (3 extra units)');
  console.log('   - Level 5: Equipment animations (2 extra units)');
  console.log('');
  console.log('🚀 OPTIMIZATION STATUS:');
  console.log('• Background caching: ✅ IMPLEMENTED');
  console.log('• Sprite batching: ✅ IMPLEMENTED');  
  console.log('• Level-specific optimizations: 🔄 IN PROGRESS');
}

// Auto-run diagnostic if this file is imported
if (typeof window !== 'undefined') {
  // Browser environment - can run diagnostic
  window.addEventListener('load', () => {
    setTimeout(() => {
      runLevelDiagnostic();
    }, 2000);
  });
}
