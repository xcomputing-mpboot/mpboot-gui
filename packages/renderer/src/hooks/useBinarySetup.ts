import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store/root';
import { useElectron } from './useElectron';
import { BinaryUrls, CompressedPath, getBinaryPathRemote } from '../components/sshScreen/binarydownload';

export const useBinarySetup = () => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const electron = useElectron();
  const remoteOS = useSelector((state: RootState) => state.ssh.remoteOS);

  useEffect(() => {
    const setupBinary = async () => {
      if (!remoteOS || isInstalling) return;
      
      setIsInstalling(true);
      setError(null);

      try {
        const tempDir = await electron.executeSSHCommand('mktemp -d');
        if (!tempDir.success) throw new Error('Failed to create temp directory');
        
        const tempPath = tempDir.output?.trim();
        const downloadUrl = remoteOS.includes('win') ? BinaryUrls.Windows :
                          remoteOS.includes('darwin') ? BinaryUrls.Mac :
                          BinaryUrls.Linux;

        const archiveName = downloadUrl.split('/').pop();
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const localTempPath = await saveTempFile(blob, archiveName!);

        await electron.copyContentFiletoSSH(
          localTempPath,
          `${tempPath}/${archiveName}`,
        );

        const binaryPath = getBinaryPathRemote(remoteOS);
        const commands = [
          `mkdir -p $(dirname "${binaryPath}")`,
          remoteOS.includes('win') 
            ? `7z x "${tempPath}/${archiveName}" -o"${tempPath}/extracted"` 
            : `unzip "${tempPath}/${archiveName}" -d "${tempPath}/extracted"`,
          `cp "${tempPath}/extracted/${CompressedPath[remoteOS.includes('win') ? 'Windows' : remoteOS.includes('darwin') ? 'Mac' : 'Linux']}" "${binaryPath}"`,
          `chmod +x "${binaryPath}"`,
          `rm -rf "${tempPath}"`,
        ];

        for (const cmd of commands) {
          const result = await electron.executeSSHCommand(cmd);
          if (!result.success) throw new Error(`Command failed: ${cmd}`);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsInstalling(false);
      }
    };

    setupBinary();
  }, [remoteOS]);

  return { isInstalling, error };
};

const saveTempFile = async (blob: Blob, filename: string): Promise<string> => {
  //const buffer = await blob.arrayBuffer();
  const tempPath = `/tmp/${filename}`;
  return tempPath;
};
