import { describe, expect, it } from 'vitest';
import { profile } from '@/data/profile';

describe('profile contact', () => {
  it('carries an address a mailto can actually open', () => {
    // The about page's only route to a person. A malformed address is a dead end
    // that looks like a working one.
    expect(profile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});

describe('profile track record', () => {
  it('does not claim a start year that has not happened', () => {
    // Rendered as "since {year}". A transposed digit ships "since 2041".
    expect(profile.trackRecord.since).toBeLessThanOrEqual(new Date().getFullYear());
  });

  it('keeps the summary shaped to run inside a sentence', () => {
    // The home page sets it as "I build {summary}, and have since …". A leading
    // capital or a trailing stop breaks that sentence in the middle.
    const { summary } = profile.trackRecord;
    expect(summary).not.toMatch(/^[A-Z]/);
    expect(summary).not.toMatch(/\.$/);
  });

  it('keeps the professional practice apart from what the exhibits used', () => {
    // Merged, a backend engineer reads as a front-end generalist — which is the
    // failure the two rows exist to prevent.
    const overlap = profile.trackRecord.core.filter((entry) =>
      profile.trackRecord.applied.includes(entry)
    );
    expect(overlap).toEqual([]);
  });
});

describe('profile certifications', () => {
  it('states a name, an issuer, and when it was earned', () => {
    expect(profile.certifications.length).toBeGreaterThan(0);

    for (const certification of profile.certifications) {
      expect(certification.name.trim()).not.toBe('');
      expect(certification.issuer.trim()).not.toBe('');
      expect(certification.issued.trim()).not.toBe('');
    }
  });

  it('cites a receipt on the issuer rather than on this site', () => {
    // The about page files these under "Claims should have receipts". A record
    // with nowhere to check it is the one thing that section exists to stop.
    for (const certification of profile.certifications) {
      expect(certification.credentialUrl).toMatch(/^https:\/\/[^\s]+$/);
    }
  });

  it('never links a credential form that asks a visitor to sign in', () => {
    // Credly shows the owner `/earner/earned/badge/<id>` while they are logged
    // in, and that form redirects a logged-out reader to a sign-in wall — a
    // receipt nobody but the claimant can read. The public form is
    // `/badges/<id>/public_url`, and it is the one that has to ship.
    for (const certification of profile.certifications) {
      expect(certification.credentialUrl).not.toContain('/earner/earned/');
    }
  });
});
