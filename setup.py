from setuptools import setup, find_packages

with open('requirements.txt') as f:
    requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]

setup(
    name='oneprompt',
    version='0.1.0',
    packages=find_packages(),
    install_requires=requirements,
    extras_require={
        'dev': [
            'pytest>=7.4.0',
            'pytest-asyncio>=0.21.0',
        ]
    },
    python_requires='>=3.8',
    entry_points={
        'console_scripts': [
            'oneprompt=main:cli',
        ],
    },
)
