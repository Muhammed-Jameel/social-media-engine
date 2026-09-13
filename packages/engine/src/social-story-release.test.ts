import { describe, expect, it } from 'vitest';
import { StoryReleaseSchema, StoryReviewSchema } from './social-story-release';

describe('static Story review boundaries',()=>{
 it('rejects a review for different bytes or a failing visual review',()=>{
  const review={manifestSha256:'expected',passed:true,reviewer:'critic',producer:'producer',observations:['Readable','No fake controls','Correct account binding'],hardFailures:[],evidence:[{path:'proof1',sha256:'a'},{path:'proof2',sha256:'b'}]};
  expect(StoryReviewSchema('expected').safeParse(review).success).toBe(true);
  expect(StoryReviewSchema('changed').safeParse(review).success).toBe(false);
  expect(StoryReviewSchema('expected').safeParse({...review,hardFailures:['Unfinished sticker']}).success).toBe(false);
 });
 it('rejects horizontal Story assets and extra unreviewed API copy',()=>{
  const item={contentId:'S01',title:'Title',scheduledAt:'2026-09-11T06:45:00Z',pillar:'AI services',timeBand:'morning',asset:{path:'story.png',sha256:'a'.repeat(64),mimeType:'image/png',width:1080,height:1920},accounts:{instagram:'ig',facebook:'fb'},caption:''};
  const items=['S01','B01','U01','S02','B02','U02'].map(contentId=>({...item,contentId}));
  expect(StoryReleaseSchema.safeParse({version:1,items}).success).toBe(true);
  expect(StoryReleaseSchema.safeParse({version:1,items:items.map(i=>({...i,asset:{...i.asset,width:1920,height:1080}}))}).success).toBe(false);
  expect(StoryReleaseSchema.safeParse({version:1,items:items.map(i=>({...i,caption:'unreviewed'}))}).success).toBe(false);
 });
});
