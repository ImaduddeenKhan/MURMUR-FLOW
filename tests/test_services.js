import assert from 'assert';
import { storage } from '../server/services/storageService.js';
import { zeroEditEngine } from '../server/services/zeroEditEngine.js';
import { notetakerService } from '../server/services/notetakerService.js';

async function runTests() {
  console.log('🧪 Starting WhisperFlow Service Tests...\n');

  // Test 1: Storage Service
  console.log('1️⃣ Testing Storage Service...');
  const settings = storage.getSettings();
  assert.ok(settings, 'Settings should be defined');
  assert.ok(settings.defaultTone, 'Default tone should exist');

  const dict = storage.getDictionary();
  assert.ok(Array.isArray(dict), 'Dictionary should be an array');
  assert.ok(dict.length > 0, 'Dictionary should have default terms');
  console.log('   ✓ Storage service loaded successfully.');

  // Test 2: Snippet matching
  console.log('2️⃣ Testing Snippets Engine...');
  const snippetMatch = zeroEditEngine.checkSnippets('insert calendly');
  assert.strictEqual(snippetMatch.matched, true, 'Snippet should match "insert calendly"');
  assert.ok(snippetMatch.snippet.content.includes('calendly.com'), 'Snippet expansion should contain calendly link');
  console.log('   ✓ Snippet matched and expanded correctly.');

  // Test 3: Zero-Edit Local Heuristic Cleanup
  console.log('3️⃣ Testing Zero-Edit Local Heuristic Cleanup...');
  const rawSpeech = 'Umm hey so can you wait can you tell the team that the the launch is slipping to like not Friday the following Monday because we are waiting on uh legal';
  const cleaned = zeroEditEngine.localHeuristicCleanup(rawSpeech);

  assert.ok(!cleaned.toLowerCase().includes('umm'), 'Should remove "umm"');
  assert.ok(!cleaned.toLowerCase().includes('the the'), 'Should remove duplicate words "the the"');
  console.log(`   Raw Input: "${rawSpeech}"`);
  console.log(`   Cleaned Output: "${cleaned}"`);
  console.log('   ✓ Local heuristic clean-up stripped filler words and stutters.');

  // Test 4: Zero-Edit Engine Full Process & Tone Varieties
  console.log('4️⃣ Testing Zero-Edit Engine full pipeline & Tone Varieties...');
  const resCasual = await zeroEditEngine.process('Hey um let us meet at 5 actually 6pm', { tone: 'casual' });
  assert.ok(resCasual.processedText, 'Processed text should exist for casual');
  console.log(`   Casual: "${resCasual.processedText}"`);

  const resBullet = await zeroEditEngine.process('First step is design. Second step is build. Third step is test.', { tone: 'bullet' });
  assert.ok(resBullet.processedText.includes('-'), 'Bullet mode should format with dashes');
  console.log(`   Bullet:\n${resBullet.processedText}`);

  const resStandup = await zeroEditEngine.process('Finished the zero-edit engine and tested APIs', { tone: 'standup' });
  assert.ok(resStandup.processedText.includes('Yesterday:') || resStandup.processedText.includes('Today:'), 'Standup should have standup headers');
  console.log(`   Standup:\n${resStandup.processedText}`);

  const resSocial = await zeroEditEngine.process('Just open-sourced WhisperFlow, the fastest voice dictation tool.', { tone: 'social' });
  assert.ok(resSocial.processedText.includes('#'), 'Social mode should have hashtags');
  console.log(`   Social:\n${resSocial.processedText}`);
  console.log('   ✓ Zero-edit pipeline & tone varieties completed successfully.');

  // Test 5: Notetaker Service
  console.log('5️⃣ Testing Notetaker Service...');
  const meetingTranscript = 'Stephen: Tuesday is better. Mikel: I will add it to the calendar. Nathalie: Make sure the Tableau dashboard is ready.';
  const summaryRes = await notetakerService.summarizeMeeting(meetingTranscript, {
    title: 'Test Meeting'
  });
  assert.ok(summaryRes.summary, 'Summary should be generated');
  assert.ok(summaryRes.meeting, 'Meeting record should be saved');
  console.log('   ✓ Notetaker summary produced successfully.');

  console.log('\n🎉 ALL TESTS PASSED! WhisperFlow core services are functional.\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
