import { expect } from 'chai'

import {
  PullRequestDatabase,
  IPullRequestStatus,
} from '../../src/lib/databases'

describe('PullRequestDatabase', () => {
  describe('PullRequestTable', () => {
    it.only('renames indexes retaining original data on when upgrading to version 5', async () => {
      const databaseName = 'TestPullRequestDatabase'

      let database = new PullRequestDatabase(databaseName, 4)
      await database.delete()
      await database.open()

      // untyped because field names have been updated
      const pr = {
        number: 1,
        title: 'title',
        createdAt: '2018-01-01',
        head: {
          repositoryId: 1,
          ref: 'head',
          sha: 'head.sha',
        },
        base: {
          repositoryId: 10,
          ref: 'base',
          sha: 'base.sha',
        },
        author: 'me',
      }

      // insert into old version of table
      const oldSchema = database.table('pullRequests')
      await oldSchema.add(pr)
      const prFromDb = await oldSchema.get(1)
      expect(prFromDb).to.not.be.undefined
      expect(prFromDb!.number).to.equal(pr.number)

      database.close()
      database = new PullRequestDatabase(databaseName, 5)
      await database.open()

      const upgradedPrFromDb = await database.pullRequest.get(1)
      expect(upgradedPrFromDb).is.not.undefined
      expect(upgradedPrFromDb!._id).to.equal(1)
      expect(upgradedPrFromDb!.created_at).to.equal(pr.createdAt)

      await database.delete()
    })
  })

  describe('PullRequestStatusTable', () => {
    it('adds default value for the statuses key when upgrading to version 4', async () => {
      const databaseName = 'TestPullRequestDatabase'

      let database = new PullRequestDatabase(databaseName, 3)
      await database.delete()
      await database.open()

      const prStatus: IPullRequestStatus = {
        pull_request_id: 1,
        state: 'success',
        total_count: 1,
        sha: 'sha',
        status: [],
      }
      await database.pullRequestStatuses.add(prStatus)
      const prStatusFromDb = await database.pullRequestStatuses.get(1)
      expect(prStatusFromDb).to.not.be.undefined
      expect(prStatusFromDb!.pull_request_id).to.equal(prStatus.pull_request_id)

      database.close()
      database = new PullRequestDatabase(databaseName, 4)
      await database.open()

      const upgradedPrStatusFromDb = await database.pullRequestStatuses.get(1)
      expect(upgradedPrStatusFromDb).is.not.undefined
      expect(upgradedPrStatusFromDb!.pull_request_id).to.equal(
        prStatus.pull_request_id
      )
      expect(upgradedPrStatusFromDb!.status).is.not.undefined

      await database.delete()
    })
  })
})