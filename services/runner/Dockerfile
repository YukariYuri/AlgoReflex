# The release process must publish this image by digest. The runner accepts the
# image reference from trusted server configuration; user requests never choose it.
FROM gcc:13.3.0-bookworm

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# LLVM's official Debian repository supplies the approved clang++-17 profile.
RUN apt-get update \
    && apt-get install --no-install-recommends -y ca-certificates curl gnupg \
    && install -d -m 0755 /etc/apt/keyrings \
    && curl --fail --silent --show-error https://apt.llvm.org/llvm-snapshot.gpg.key \
      | gpg --dearmor -o /etc/apt/keyrings/llvm.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/llvm.gpg] http://apt.llvm.org/bookworm/ llvm-toolchain-bookworm-17 main" \
      > /etc/apt/sources.list.d/llvm.list \
    && apt-get update \
    && apt-get install --no-install-recommends -y clang-17 \
    && ln -s /usr/bin/g++ /usr/local/bin/g++-13 \
    && ln -s /usr/bin/clang++-17 /usr/local/bin/clang++-17 \
    && groupadd --gid 10001 runner \
    && useradd --uid 10001 --gid runner --no-create-home --shell /usr/sbin/nologin runner \
    && install -d -o runner -g runner -m 0755 /sandbox/bin \
    && rm -rf /var/lib/apt/lists/*

USER 10001:10001
WORKDIR /sandbox
