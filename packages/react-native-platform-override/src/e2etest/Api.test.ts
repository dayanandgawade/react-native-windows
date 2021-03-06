/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * @format
 */

import * as Api from '../Api';
import * as path from 'path';
import {usingOverrideRepo} from './Resource';

const SAMPLE_REPO_VERSION = '0.0.0-56cf99a96';

test('validateManifest', async () => {
  await usingOverrideRepo('sampleOverrideRepo', async (_, repoPath) => {
    const opts = {
      manifestPath: path.join(repoPath, 'overrides.json'),
      reactNativeVersion: SAMPLE_REPO_VERSION,
    };

    const validatonErrors = await Api.validateManifest(opts);

    expect(validatonErrors).toEqual([
      {
        overrideName: 'setUpDeveloperTools.windesktop.js',
        type: 'missingFromManifest',
      },
    ]);
  });
});

test('hasOverride', async () => {
  await usingOverrideRepo('sampleOverrideRepo', async (_, repoPath) => {
    const opts = {
      manifestPath: path.join(repoPath, 'overrides.json'),
    };

    expect(
      await Api.hasOverride('ReactCommon\\yoga\\yoga\\Yoga.cpp', opts),
    ).toBe(true);

    expect(
      await Api.hasOverride('ReactCommon\\yoga\\yoga\\Karate.cpp', opts),
    ).toBe(false);
  });
});

test('removeOverride', async () => {
  await usingOverrideRepo('sampleOverrideRepo', async (_, repoPath) => {
    const opts = {
      manifestPath: path.join(repoPath, 'overrides.json'),
    };

    expect(
      await Api.removeOverride('ReactCommon\\yoga\\yoga\\Yoga.cpp', opts),
    ).toBe(true);

    expect(
      await Api.removeOverride('ReactCommon\\yoga\\yoga\\Karate.cpp', opts),
    ).toBe(false);
  });
});

test('addOverride', async () => {
  await usingOverrideRepo('sampleOverrideRepo', async (_, repoPath) => {
    const opts = {
      manifestPath: path.join(repoPath, 'overrides.json'),
      reactNativeVersion: SAMPLE_REPO_VERSION,
    };

    const factory = await Api.getOverrideFactory(opts);
    const override = await factory.createPlatformOverride(
      'setUpDeveloperTools.windesktop.js',
    );

    await Api.addOverride(override, opts);
    expect(
      await Api.hasOverride('setUpDeveloperTools.windesktop.js', opts),
    ).toBe(true);

    expect(await Api.validateManifest(opts)).toEqual([]);
  });
});

test('upgradeOverrides', async () => {
  await usingOverrideRepo('sampleOverrideRepo', async (_, repoPath) => {
    const opts = {
      manifestPath: path.join(repoPath, 'overrides.json'),
      reactNativeVersion: '0.0.0-42c8dead6',
      allowConflicts: false,
      progressListener: expectIncrementing(3),
    };

    const upgradeResults = await Api.upgradeOverrides(opts);

    expect(upgradeResults).toEqual([
      {
        fileWritten: true,
        hasConflicts: false,
        overrideName:
          'ReactCommon\\turbomodule\\samples\\SampleTurboCxxModule.cpp',
      },
      {
        fileWritten: true,
        hasConflicts: false,
        overrideName:
          'ReactCommon\\turbomodule\\samples\\SampleTurboCxxModule.h',
      },
      {
        fileWritten: false,
        hasConflicts: true,
        overrideName: 'ReactCommon\\yoga\\yoga\\Yoga.cpp',
      },
    ]);
  });
});

function expectIncrementing(
  expectedTotal: number,
): Api.UpgradeProgressListener {
  let expectedCurrent = 1;

  return (current, total) => {
    expect(current).toBe(expectedCurrent);
    expect(total).toBe(expectedTotal);
    expect(current).toBeLessThanOrEqual(total);
    expectedCurrent++;
  };
}
