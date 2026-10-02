import fs from 'fs';
import path from 'path';

import Gravity from "../blocks/Gravity/Gravity";

export default function Page() {

  const gravityDirectory =
    path.join(
      process.cwd(),
      'public',
      'assets',
      'gravity'
    );


  const gravityAssets =
    fs
      .readdirSync(gravityDirectory)
      .filter(
        (file) =>
          /\.(png|jpe?g|webp|gif)$/i.test(file)
      )
      .map(
        (file) =>
          `/assets/gravity/${file}`
      );


  return (

    <main>

      <Gravity assets={gravityAssets} />

    </main>

  );

}