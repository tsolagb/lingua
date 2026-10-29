import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EVERYDAY_DIALOGUE_TOPICS,
  getEverydayDialogueExchanges,
} from '../data/thematic-vocabulary.ts';

const languages = ['italian', 'french', 'spanish', 'armenian'];
const expectedTopics = ['groceries', 'restaurant', 'museum', 'school', 'home', 'social'];

test('everyday conversation practice covers the requested situations and is not level-gated', () => {
  assert.deepEqual(
    EVERYDAY_DIALOGUE_TOPICS.map(topic => topic.id),
    expectedTopics,
  );

  for (const topic of EVERYDAY_DIALOGUE_TOPICS) {
    assert.ok(topic.title.trim(), `${topic.id}: topic title is required`);
    assert.ok(topic.categoryIds.length > 0, `${topic.id}: connect the dialogue to its vocabulary topics`);
    assert.equal(topic.lines.length, 4, `${topic.title} should be a short four-turn exchange`);
    assert.deepEqual(topic.lines.map(line => line.speaker), ['A', 'B', 'A', 'B']);
    const exchanges = getEverydayDialogueExchanges(topic);
    assert.equal(exchanges.length, 2, `${topic.title} should have two learner reply turns`);

    for (const line of topic.lines) {
      assert.ok(line.english.trim(), `${topic.title}: English meaning is required`);
      for (const language of languages) {
        assert.ok(
          line.translations[language].trim(),
          `${topic.title}: ${language} line is required`,
        );
      }
      assert.match(line.translations.armenian, /[\u0530-\u058F]/);
    }

    for (const exchange of exchanges) {
      assert.equal(exchange.prompt.speaker, 'A');
      assert.equal(exchange.reply.speaker, 'B');
      for (const language of languages) {
        assert.ok(exchange.prompt.translations[language].trim());
        assert.ok(exchange.reply.translations[language].trim());
      }
    }
  }
});
