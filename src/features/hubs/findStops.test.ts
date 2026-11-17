import { describe, expect, it } from 'vitest';
import { acquisition } from '@/data/acquisition';
import { whereToFind } from './findStops';

describe('whereToFind', () => {
  it('names the boss that drops Moonveil', () => {
    const stops = whereToFind(9060000, acquisition);
    const gives = stops.filter((stop) => stop.gives);
    expect(gives).toHaveLength(1);
    expect(gives[0]!.how).toBe('Defeat Magma Wyrm');
    expect(gives[0]!.area).not.toBe('No fixed place');
  });

  it('gives a starting weapon at the start or where it lies', () => {
    const stops = whereToFind(9000000, acquisition); // Uchigatana: the Samurai's, or a pickup
    expect(stops.some((stop) => stop.gives)).toBe(true);
  });

  it('is empty for a weapon the data doesn’t place', () => {
    expect(whereToFind(1, acquisition)).toEqual([]);
  });
});
