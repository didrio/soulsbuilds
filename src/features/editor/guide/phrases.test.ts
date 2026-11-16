import { describe, expect, it } from 'vitest';
import { MOONVEIL } from '@/test/fixtures';
import { actionLead, actionNote, itemInfo, itemNotes, legTitle, stepPlace } from './phrases';
import type { RouteAction, RouteItem, RouteLeg } from './route';

const action = (kind: RouteAction['kind'], detail = ''): RouteAction => ({
  kind,
  detail,
  items: [],
});
const item: RouteItem = { ref: { file: 'weapons', id: MOONVEIL } };

describe('guide phrases', () => {
  it.each([
    [action('pickup'), 'Pick up'],
    [action('restore'), 'Restore'],
    [action('boss', 'Magma Wyrm'), 'Defeat Magma Wyrm'],
    [action('enemy', 'Man-Bat'), 'Farm Man-Bat'],
    [action('shop', 'Twin Maiden Husks'), 'Buy from Twin Maiden Husks'],
    [action('remembrance', 'Finger Reader Enia'), 'Trade with Finger Reader Enia'],
    [action('quest', "Count Ymir's quest"), "Count Ymir's quest"],
    [action('quest'), 'Quest reward'],
    [action('start', 'Samurai'), 'Start as Samurai'],
    [action('alteration', 'Alter at a Site of Grace'), 'Alter at a Site of Grace'],
    [action('craft', "Armorer's Cookbook [2]"), "Craft with Armorer's Cookbook [2]"],
    [action('craft', 'Known from the start'), 'Craft (recipe known from the start)'],
    [action('gate', 'Defeat Margit, the Fell Omen'), 'Defeat Margit, the Fell Omen'],
    [action('unknown'), 'No known source yet'],
  ])('%o leads with "%s"', (given, expected) => {
    expect(actionLead(given)).toBe(expected);
  });

  it('notes where a pickup is, and nothing for other actions', () => {
    expect(actionNote(action('pickup', 'Teardrop Scarab'))).toBe('Teardrop Scarab');
    expect(actionNote(action('boss', 'Godrick'))).toBe('');
  });

  it('names items, key items without an icon', () => {
    expect(itemInfo(item.ref)).toMatchObject({ name: 'Moonveil', icon: expect.any(Number) });
    expect(itemInfo({ file: 'keyItems', id: 8590 })).toEqual({
      name: 'Whetstone Knife',
      icon: null,
    });
  });

  it('notes prices, trades, alterations and starting classes', () => {
    expect(
      itemNotes(action('shop'), { ...item, cost: { amount: 12500, currency: 'runes' } }),
    ).toEqual(['12,500 runes']);
    expect(
      itemNotes(action('shop'), { ...item, cost: { amount: 1, currency: 'dragon-hearts' } }),
    ).toEqual(['1 Dragon Heart']);
    expect(
      itemNotes(action('remembrance'), { ...item, needs: { file: 'keyItems', id: 8590 } }),
    ).toEqual(['for Whetstone Knife']);
    expect(
      itemNotes(action('pickup'), { ...item, startAlso: ['Vagabond', 'Hero', 'Hero'] }),
    ).toEqual(['or start as Vagabond or Hero']);
  });

  it('titles legs and steps', () => {
    const region = { id: 1, name: 'Caelid', dlc: false, requires: [], order: 1 };
    const leg = (kind: RouteLeg['kind']): RouteLeg => ({
      kind,
      region: kind === 'region' ? region : null,
      steps: [],
    });
    expect(legTitle(leg('region'))).toBe('Caelid');
    expect(legTitle(leg('start'))).toBe('At the start');
    expect(legTitle(leg('elsewhere'))).toBe('No fixed place');
    expect(stepPlace(leg('region'), null)).toBe('Somewhere in Caelid');
    expect(stepPlace(leg('region'), { name: 'Gael Tunnel' })).toBe('Gael Tunnel');
    expect(stepPlace(leg('start'), null)).toBeNull();
  });
});
