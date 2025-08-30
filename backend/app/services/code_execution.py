import docker
import tempfile
import os
import time
from typing import Dict, Tuple
from ..core.config import settings

class CodeExecutionService:
    def __init__(self):
        # Delay creating the docker client until it's actually needed. This
        # allows the FastAPI app to start in environments where the docker
        # daemon isn't accessible (for example, on Windows without Docker
        # socket forwarding).
        self.client = None
        self.c_image = "gcc:latest"

    def _get_client(self):
        if self.client is None:
            try:
                self.client = docker.from_env()
            except Exception as e:
                # Keep client None and let callers handle missing client
                print(f"Warning: Docker client not available: {e}")
                self.client = None
        return self.client

    def _ensure_image(self):
        """Ensure the Docker image is available."""
        client = self._get_client()
        if client is None:
            return
        try:
            client.images.get(self.c_image)
        except docker.errors.ImageNotFound:
            print(f"Pulling {self.c_image} image...")
            client.images.pull(self.c_image)

    def execute_c_code(self, code: str, input_data: str = "", time_limit: int = 5, memory_limit: int = 256) -> Dict:
        """
        Execute C code in a secure Docker container.
        
        Args:
            code: C source code to execute
            input_data: Input data for the program
            time_limit: Time limit in seconds
            memory_limit: Memory limit in MB
            
        Returns:
            Dict containing execution results
        """
        try:
            # Create temporary directory for code execution
            with tempfile.TemporaryDirectory() as temp_dir:
                # Write source code to file
                source_file = os.path.join(temp_dir, "main.c")
                with open(source_file, "w") as f:
                    f.write(code)

                # Write input data to file
                input_file = os.path.join(temp_dir, "input.txt")
                with open(input_file, "w") as f:
                    f.write(input_data)

                # Docker container configuration
                container_config = {
                    "image": self.c_image,
                    "command": [
                        "bash", "-c",
                        "cd /workspace && "
                        f"timeout {time_limit}s gcc -o main main.c && "
                        f"timeout {time_limit}s ./main < input.txt"
                    ],
                    "volumes": {temp_dir: {"bind": "/workspace", "mode": "rw"}},
                    "working_dir": "/workspace",
                    "network_disabled": True,
                    "mem_limit": f"{memory_limit}m",
                    "memswap_limit": f"{memory_limit}m",
                    "cpu_period": 100000,
                    "cpu_quota": 50000,  # 50% CPU
                    "remove": True,
                }

                start_time = time.time()

                client = self._get_client()
                if client is None:
                    return {
                        "status": "system_error",
                        "output": "",
                        "execution_time": 0,
                        "memory_used": 0,
                        "error": "Docker client not available"
                    }

                try:
                    # Run container and capture output
                    result = client.containers.run(**container_config)
                    execution_time = int((time.time() - start_time) * 1000)  # Convert to milliseconds

                    # `run` may return bytes or text output; handle both
                    if isinstance(result, (bytes, bytearray)):
                        output = result.decode('utf-8').strip()
                    else:
                        try:
                            # If a container object was returned, fetch its logs
                            output = client.containers.get(result.id).logs().decode('utf-8').strip()
                        except Exception:
                            output = ''

                    return {
                        "status": "success",
                        "output": output,
                        "execution_time": execution_time,
                        "memory_used": 0,
                        "error": None
                    }

                except docker.errors.ContainerError as e:
                    # Container exited with non-zero status
                    execution_time = int((time.time() - start_time) * 1000)
                    error_output = e.stderr.decode('utf-8') if getattr(e, 'stderr', None) else str(e)

                    # Determine error type
                    if "gcc" in error_output or "error:" in error_output.lower():
                        status = "compile_error"
                    elif "timeout" in error_output.lower():
                        status = "time_limit_exceeded"
                    else:
                        status = "runtime_error"

                    return {
                        "status": status,
                        "output": "",
                        "execution_time": execution_time,
                        "memory_used": 0,
                        "error": error_output
                    }

                except Exception as e:
                    return {
                        "status": "system_error",
                        "output": "",
                        "execution_time": 0,
                        "memory_used": 0,
                        "error": str(e)
                    }

        except Exception as e:
            return {
                "status": "system_error",
                "output": "",
                "execution_time": 0,
                "memory_used": 0,
                "error": str(e)
            }

    def run_test_cases(self, code: str, test_cases: list, time_limit: int = 5, memory_limit: int = 256) -> list:
        """
        Run code against multiple test cases.
        
        Args:
            code: C source code
            test_cases: List of test case dictionaries with 'input' and 'expected_output'
            time_limit: Time limit per test case
            memory_limit: Memory limit in MB
            
        Returns:
            List of test results
        """
        results = []
        
        for i, test_case in enumerate(test_cases):
            result = self.execute_c_code(
                code=code,
                input_data=test_case["input_data"],
                time_limit=time_limit,
                memory_limit=memory_limit
            )
            
            # Check if output matches expected
            if result["status"] == "success":
                actual_output = result["output"].strip()
                expected_output = test_case["expected_output"].strip()
                passed = actual_output == expected_output
            else:
                passed = False
            
            results.append({
                "test_case_id": test_case.get("id", i + 1),
                "passed": passed,
                "actual_output": result["output"],
                "expected_output": test_case["expected_output"],
                "execution_time": result["execution_time"],
                "memory_used": result["memory_used"],
                "error": result["error"],
                "status": result["status"]
            })
        
        return results

def get_code_executor():
    """Return a singleton CodeExecutionService instance."""
    # Lazily create the executor and cache it on the function object
    if not hasattr(get_code_executor, "_instance"):
        get_code_executor._instance = CodeExecutionService()
    return get_code_executor._instance
