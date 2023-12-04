import { GraphQLError } from "graphql";
import {
  countJobs,
  createJob,
  deleteJob,
  getJob,
  getJobs,
  getJobsByCompanyId,
  updateJob,
} from "./db/jobs.js";
import { getCompany } from "./db/companies.js";

export const resolvers = {
  Query: {
    job: async (_root, { id }) => {
      const job = await getJob(id);
      if (!job) {
        throw new GraphQLError(`job with id: ${id} Does not exist`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return job;
    },
    company: async (_root, { id }) => {
      const company = await getCompany(id);
      if (!company) {
        throw new GraphQLError(`company with id: ${id} Does not exist`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return company;
    },
    jobs: async (_root, { limit, offset }) => {
      const items = await getJobs(limit, offset);
      const totalCount = await countJobs();
      return { items, totalCount };
    },
  },

  Mutation: {
    createJob: (_root, { input: { title, description } }, { user }) => {
      if (!user) {
        throw new GraphQLError("The user is not authenticated", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }
      const companyId = user.companyId;
      return createJob({ companyId, title, description });
    },
    updateJob: async (
      _root,
      { input: { id, title, description } },
      { user }
    ) => {
      if (!user) {
        throw new GraphQLError("The user is not authenticated", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }
      const job = await updateJob({
        id,
        title,
        description,
        companyId: user.companyId,
      });
      if (!job) {
        throw new GraphQLError(`job with id: ${id} Does not exist`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return job;
    },
    deleteJob: async (_root, { id }, { user }) => {
      if (!user) {
        throw new GraphQLError("The user is not authenticated", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      const job = await deleteJob(id, user.companyId);
      if (!job) {
        throw new GraphQLError(`job with id: ${id} Does not exist`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return job;
    },
  },
  Job: {
    company: (job, _args, { companyLoader }) =>
      companyLoader.load(job.companyId),

    date: (job) => job.createdAt,
  },

  Company: {
    jobs: (company) => getJobsByCompanyId(company.id),
  },
};
