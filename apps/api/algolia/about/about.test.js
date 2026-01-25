const about = require('./about.json');

describe('about.json data shape', () => {
  it('should have exactly 27 about records', () => {
    expect(about).toHaveLength(27);
  });

  it('should have valid objectID format', () => {
    about.forEach((record) => {
      expect(record.objectID).toMatch(/^about\..+$/);
    });
  });

  it('should have node_type as about', () => {
    about.forEach((record) => {
      expect(record.node_type).toBe('about');
    });
  });

  it('should have required fields for all records', () => {
    const requiredFields = [
      'objectID',
      'node_type',
      'section',
      'title',
      'aliases',
      'tags',
      'updated_at',
      'data',
    ];

    about.forEach((record) => {
      requiredFields.forEach((field) => {
        expect(record[field]).toBeDefined();
      });
    });
  });

  it('should have unique objectIDs', () => {
    const ids = about.map((r) => r.objectID);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(about.length);
  });

  it('should have unique sections', () => {
    const sections = about.map((r) => r.section);
    const uniqueSections = new Set(sections);
    expect(uniqueSections.size).toBe(about.length);
  });

  it('should have objectID matching section pattern', () => {
    about.forEach((record) => {
      const expectedId = `about.${record.section}`;
      expect(record.objectID).toBe(expectedId);
    });
  });
});
