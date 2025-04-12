// custom-jest-github-pages-reporter.js
import { Octokit } from "@octokit/rest";
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import fs from 'fs';
import { fromByteArray } from 'base64-js';

class GitHubPagesReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options || {};
    
    // GitHub repository details
    this.owner = process.env.GITHUB_REPOSITORY_OWNER;
    this.repo = process.env.GITHUB_REPOSITORY_NAME;
    this.branch = process.env.GITHUB_PAGES_BRANCH || 'gh-pages';  // Default branch for GitHub Pages
    this.reportDir = this._options.reportDir || 'test-reports';
    this.commitMessage = this._options.commitMessage || 'Update test reports';
    
    // Authentication
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    
    if (!this.owner || !this.repo || !process.env.GITHUB_TOKEN) {
      console.error('GitHub owner, repo, or token not provided');
      throw new Error('GitHub owner, repo, or token not provided');
    }
  }
  
  async onRunComplete(contexts, results) {
    try {
      console.log('Preparing to upload test reports to GitHub Pages...');
      
      // Variables to track if this is the first commit
      let baseTree = null;
      let parentCommit = null;
      
      // Try to get the latest commit from the target branch
      try {
        const { data: refData } = await this.octokit.git.getRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${this.branch}`,
        });
        
        parentCommit = refData.object.sha;
        
        const { data: commitData } = await this.octokit.git.getCommit({
          owner: this.owner,
          repo: this.repo,
          commit_sha: parentCommit,
        });
        
        baseTree = commitData.tree.sha;
      } catch (error) {
        // Branch doesn't exist yet - that's okay, we'll create it
        console.log(`Branch ${this.branch} not found, will create it from scratch`);
      }
      
      // Create tree with our files (either with or without a base)
      const { data: treeData } = await this.octokit.git.createTree({
        owner: this.owner,
        repo: this.repo,
        base_tree: baseTree, // This will be null for first commit
        tree: await this.prepareTreeItems()
      });
      
      // Create a new commit
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner: this.owner,
        repo: this.repo,
        message: this.commitMessage,
        tree: treeData.sha,
        parents: parentCommit ? [parentCommit] : [], // Empty array for first commit
      });
      
      // Update or create the branch reference
      try {
        await this.octokit.git.updateRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${this.branch}`,
          sha: newCommit.sha,
          force: true // Force update in case of conflicts
        });
        console.log(`Updated existing branch ${this.branch}`);
      } catch (error) {
        // Branch doesn't exist, create it
        await this.octokit.git.createRef({
          owner: this.owner,
          repo: this.repo,
          ref: `refs/heads/${this.branch}`,
          sha: newCommit.sha,
        });
        console.log(`Created new branch ${this.branch}`);
      }
      
      console.log(`Test reports successfully pushed to ${this.branch}`);
    } catch (error) {
      console.error('Error uploading test reports to GitHub Pages:', error.message);
      if (error.response) {
        console.error('API response:', error.response.data);
      }
    }
  }
  
  // Helper function to prepare tree items
  async prepareTreeItems() {
    const tree = [];
    const reportDirectory = path.resolve(process.cwd(), this.reportDir);
    
    if (!fs.existsSync(reportDirectory)) {
      throw new Error(`Report directory ${reportDirectory} does not exist`);
    }
    
    // Read files recursively
    const readFilesRecursively = (dir, baseDir = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(baseDir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          readFilesRecursively(fullPath, relativePath);
        } else {
          const content = fs.readFileSync(fullPath);
          tree.push({
            path: relativePath,
            mode: '100644',
            type: 'blob',
            content: content.toString('utf8'),
          });
        }
      }
    };
    
    readFilesRecursively(reportDirectory);
    return tree;
  }
}


export default GitHubPagesReporter;