from setuptools import setup, find_packages

with open('requirements.txt') as f:
    requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]

setup(
    name='project',
    version='0.1.0',
    packages=find_packages(),
    install_requires=requirements,
    extras_require={
        'dev': [
            'pytest>=7.4.0',
        ]
    },
    python_requires='>=3.8',
)
