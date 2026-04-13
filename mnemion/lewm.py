import torch
import torch.nn.functional as F
class SIGReg(torch.nn.Module):
    """
    Sketch Isotropic Gaussian Regularizer (SIGReg) for Mnemion.
    
    This module measures how much an embedding distribution deviates from 
    an isotropic Gaussian. It can be used as a loss function to "groom" 
    the latent space of the memory palace.
    """

    def __init__(self, knots=17, num_proj=1024):
        super().__init__()
        self.num_proj = num_proj
        # Integration knots for the Epps-Pulley test
        t = torch.linspace(0, 3, knots, dtype=torch.float32)
        dt = 3 / (knots - 1)
        weights = torch.full((knots,), 2 * dt, dtype=torch.float32)
        weights[[0, -1]] = dt
        window = torch.exp(-t.square() / 2.0)

        self.register_buffer("t", t)
        self.register_buffer("phi", window)
        self.register_buffer("weights", weights * window)

    def forward(self, z):
        """
        Compute SIGReg loss for a batch of embeddings.
        z: (N, D) tensor of embeddings.
        """
        N, D = z.shape
        if N < 2:
            return torch.tensor(0.0, device=z.device, requires_grad=True)

        # Sample random projections
        A = torch.randn(D, self.num_proj, device=z.device)
        A = A / A.norm(p=2, dim=0, keepdim=True)

        # Project embeddings: (N, M)
        proj = torch.matmul(z, A)

        # Compute the Epps-Pulley statistic
        x_t = proj.unsqueeze(-1) * self.t

        # Mean over memories N
        cos_mean = x_t.cos().mean(dim=0) # (M, K)
        sin_mean = x_t.sin().mean(dim=0) # (M, K)

        err = (cos_mean - self.phi).square() + sin_mean.square()
        statistic = torch.matmul(err, self.weights) * N

        return statistic.mean()

def groom_embeddings(embeddings, iterations=10, lr=0.01, sigreg_weight=0.1):
    """
    Adjust a batch of embeddings to be more 'Isotropic Gaussian'.
    Standard production settings for stability and semantic integrity.
    """
    if len(embeddings) < 2:
        return embeddings

    z = torch.tensor(embeddings, dtype=torch.float32, requires_grad=True)
    sigreg_mod = SIGReg()

    for _ in range(iterations):
        if z.grad is not None:
            z.grad.zero_()

        # 1. Diversity loss: push vectors away (Angular Spreading)
        z_norm = F.normalize(z, p=2, dim=1)
        sim_matrix = torch.mm(z_norm, z_norm.t())
        mask = ~torch.eye(z.size(0), dtype=torch.bool, device=z.device)
        loss_diversity = sim_matrix[mask].abs().mean()

        # 2. SIGReg loss: normality constraint
        loss_sigreg = sigreg_mod(z)

        total_loss = 10.0 * loss_diversity + sigreg_weight * loss_sigreg
        total_loss.backward()

        with torch.no_grad():
            z -= lr * z.grad

    return z.detach().cpu().numpy().tolist()
