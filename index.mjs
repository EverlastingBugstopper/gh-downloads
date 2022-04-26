import readline from "readline";
import { request, gql } from "graphql-request";
import { getGhToken } from "./auth.mjs";
import config from "./graphql.config.js"

function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("What is the repo slug? ", (repo) => {
    let [owner, name] = repo.split("/");
    if (!owner || !name) {
      console.error("You must specify the repo in the form `${owner}/${name}`");
      rl.close();
      process.exit(1);
    }
    countDownloads(owner, name).then((downloads) => {
      console.log(`${owner}/${name} has ${downloads} total downloads`);
      rl.close();
      process.exit(0);
    });
  });
}

async function countDownloads(owner, name) {
  let data = await request(
    config.schema,
    gql`
      query ($name: String!, $owner: String!) {
        repository(name: $name, owner: $owner) {
          releases(last: 100) {
            edges {
              node {
                releaseAssets(last: 10) {
                  edges {
                    node {
                      downloadCount
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    { owner, name },
    {
      Authorization: `bearer ${getGhToken()}`,
    }
  );
  let totalDownloads = 0;
  for (let release of data.repository.releases.edges) {
    for (let asset of release.node.releaseAssets.edges) {
      totalDownloads += asset.node.downloadCount;
    }
  }
  return totalDownloads;
}


main();
