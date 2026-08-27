import { describe, expect, it } from 'vitest';
import { profile } from '@/data/profile';

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
