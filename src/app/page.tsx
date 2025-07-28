import ShamirReconstructor from '@/components/shamir-reconstructor';

export default function Home() {
  return (
    <main>
      <div>
        <h1>Shamir's Sentinel</h1>
        <p>
          Upload your Shamir's Secret Sharing JSON file to reconstruct the
          original secret.
        </p>
      </div>

      <ShamirReconstructor />

      <div>
        <h2>How It Works</h2>
        <div>
          <p>
            This tool helps you securely reconstruct a secret that has been
            split into multiple pieces or "shares" using an algorithm called
            Shamir's Secret Sharing.
          </p>
          <ul>
            <li>
              <strong>Reconstructs Secrets:</strong> It takes a set of shares and
              combines them to reveal the original secret data.
            </li>
            <li>
              <strong>Error Correction:</strong> You don't need all the shares.
              If you have enough valid shares (reaching the "threshold"), the
              secret can be recovered even if other shares are lost or
              corrupted.
            </li>
            <li>
              <strong>Secure &amp; Private:</strong> All calculations happen
              directly in your browser. Your secret data is never uploaded to a
              server.
            </li>
          </ul>
        </div>
      </div>

      <footer>
        <p>&copy; {new Date().getFullYear()} Shamir's Sentinel. All rights reserved.</p>
      </footer>
    </main>
  );
}
